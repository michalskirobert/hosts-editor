#!/usr/bin/env python3
"""Execute an explicitly approved plan. Approval digest is a scope check, not authentication."""
import argparse, hashlib, json, os, re, subprocess, sys, time
from pathlib import Path

class Blocked(Exception): pass

def run(*args, env=None):
 r=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env,timeout=45)
 if r.returncode: raise Blocked('Command failed: '+args[0]+' '+args[1]+' (exit '+str(r.returncode)+'); inspect locally; output withheld to avoid leaking credentials.')
 return r.stdout.strip()
def git(*a): return run('git',*a)
def require(ok,msg):
 if not ok: raise Blocked(msg)
def status(label,state='working'):
 colors={'working':'36','waiting':'33','error':'31','done':'32'}
 prefix='\033['+colors[state]+'m' if sys.stdout.isatty() else ''
 suffix='\033[0m' if prefix else ''
 print(prefix+'['+state.upper()+'] '+label+suffix,flush=True)
def digest(p): return hashlib.sha256(json.dumps(p,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def remote(branch):
 s=git('ls-remote','--heads','origin','refs/heads/'+branch)
 return s.split()[0] if s else None

def execute(p):
 root=Path(git('rev-parse','--show-toplevel')).resolve()
 require(root==Path.cwd().resolve(),'Run from repository root.')
 require(root in Path(git('rev-parse','--absolute-git-dir')).resolve().parents,'External Git directory refused.')
 require(p['target'] in ('dev','master'),'Invalid target')
 require(re.fullmatch(r'(feat|fix|hotfix|refactor|perf|test|docs|build|ci|chore)/[0-9][0-9A-Za-z.+-]*/[a-z0-9][a-z0-9-]*',p['source']),'Invalid source')
 require((p['source'].startswith('hotfix/'))==(p['target']=='master'),'Source/environment mismatch')
 require(re.fullmatch('[0-9a-f]{40}',p['sha']) and re.fullmatch('[0-9a-f]{40}',p['base_sha']),'Full SHA required')
 require(re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',p['repo']),'Invalid GitHub repository')
 url=git('remote','get-url','origin')
 require(url in ('https://github.com/'+p['repo']+'.git','https://github.com/'+p['repo'],'git@github.com:'+p['repo']+'.git'),'Origin/repository mismatch')
 task=json.loads(Path('.nurbyte/task.json').read_text())
 require(task['branch']==p['source'] and task['base']==p['target'],'Assignment differs')
 require(p['checks'] and all(c['result']=='PASS' and c['sha']==p['sha'] for c in p['checks']),'Local checks incomplete or stale')
 require(p['version'] and p['deployment'] and p['title'] and p['body'],'Missing reviewed plan fields')
 require(not git('status','--porcelain'),'Dirty checkout: preserve changes and resolve before finishing')
 current=git('branch','--show-current')
 require(current in (p['source'],p['target']),'Unexpected active branch')
 status('Inspect existing PR and remote state')
 prs=json.loads(run('gh','pr','list','--repo',p['repo'],'--head',p['source'],'--base',p['target'],'--state','all','--json','number,state,headRefOid,url'))
 matches=[x for x in prs if x['headRefOid']==p['sha'] and x['state'] in ('OPEN','MERGED')]
 require(len(matches)<=1,'Ambiguous matching PRs')
 pr=matches[0] if matches else None
 if not pr or pr['state']!='MERGED':
  require(current==p['source'] and git('rev-parse','HEAD')==p['sha'],'Approved HEAD changed')
  require(remote(p['target'])==p['base_sha'],'Target changed since approval')
  require(not prs or pr is not None,'Existing PR has changed or closed head')
  status('Push approved commit')
  run(sys.executable,'.nurbyte/push.py','--approved-sha',p['sha'])
  require(remote(p['source'])==p['sha'],'Remote source mismatch')
  if not pr:
   status('Create PR')
   # Body via stdin avoids shell interpolation and temporary tracked files.
   r=subprocess.run(['gh','pr','create','--repo',p['repo'],'--base',p['target'],'--head',p['source'],'--title',p['title'],'--body-file','-'],input=p['body'],text=True,capture_output=True,timeout=45)
   require(r.returncode==0,'PR creation failed; inspect before retry')
   prs=json.loads(run('gh','pr','list','--repo',p['repo'],'--head',p['source'],'--base',p['target'],'--state','open','--json','number,headRefOid,url'))
   require(len(prs)==1 and prs[0]['headRefOid']==p['sha'],'Created PR mismatch');pr=prs[0]
  status('Check CI','waiting')
  checks=json.loads(run('gh','pr','view',str(pr['number']),'--repo',p['repo'],'--json','statusCheckRollup'))['statusCheckRollup']
  for c in checks:
   if c.get('__typename')=='CheckRun':
    require(c.get('status')=='COMPLETED' and c.get('conclusion') in ('SUCCESS','NEUTRAL','SKIPPED'),'CI pending/failed: resume same approved plan after CI passes')
   else: require(c.get('state')=='SUCCESS','CI pending/failed')
  require(remote(p['target'])==p['base_sha'],'Target changed before merge')
  status('Merge approved PR')
  run('gh','pr','merge',str(pr['number']),'--repo',p['repo'],'--merge','--match-head-commit',p['sha'])
 data=json.loads(run('gh','pr','view',str(pr['number']),'--repo',p['repo'],'--json','state,headRefOid,baseRefName,mergeCommit,url'))
 require(data['state']=='MERGED' and data['headRefOid']==p['sha'] and data['baseRefName']==p['target'],'Merge verification failed')
 merged=data['mergeCommit']['oid']
 require(remote(p['target'])==merged,'Target advanced; stop automatic cleanup')
 status('Synchronize target and safely remove source')
 require(not git('status','--porcelain'),'Dirty checkout after merge')
 git('fetch','origin','refs/heads/'+p['target']+':refs/remotes/origin/'+p['target'])
 require(git('rev-parse','refs/remotes/origin/'+p['target'])==merged,'Fetched target changed')
 git('merge-base','--is-ancestor',p['sha'],merged)
 source=remote(p['source'])
 require(source in (None,p['sha']),'New source commits: preserve branch')
 # Atomic expected-SHA deletion. A narrow pre-push guard permits only this merged source.
 if source:
  env=os.environ.copy();env.update(NURBYTE_APPROVED_DELETE_SHA=p['sha'],NURBYTE_DELETE_TARGET=p['target'])
  run('git','push','--force-with-lease=refs/heads/'+p['source']+':'+p['sha'],'origin',':refs/heads/'+p['source'],env=env)
 git('switch',p['target']);git('merge','--ff-only','refs/remotes/origin/'+p['target'])
 exists=subprocess.run(['git','show-ref','--verify','--quiet','refs/heads/'+p['source']]).returncode==0
 if exists:
  require(git('rev-parse',p['source'])==p['sha'],'Local source has new commits')
  git('branch','-d',p['source'])
 require(remote(p['source']) is None,'Remote source still exists')
 status('Complete: '+data['url']+'; branch '+p['target']+'; source deleted locally/remotely','done')

def main():
 a=argparse.ArgumentParser(description=__doc__);a.add_argument('--plan',required=True);a.add_argument('--approved-plan');args=a.parse_args()
 p=json.loads(Path(args.plan).read_text());d=digest(p)
 if args.approved_plan is None:
  print(json.dumps(p,indent=2));print('Plan SHA256: '+d);return
 require(args.approved_plan==d,'Plan differs from approved digest')
 execute(p)
if __name__=='__main__':
 try:main()
 except (Blocked,KeyError,ValueError,OSError,subprocess.TimeoutExpired) as e:
  status(str(e),'error');sys.exit(1)
