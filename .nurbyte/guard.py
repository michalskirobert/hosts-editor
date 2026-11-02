#!/usr/bin/env python3
"""Local convenience guards. Not a tamper-proof or comprehensive secret boundary."""
import json, os, re, subprocess, sys
from pathlib import Path

def git(*args, binary=False):
 return subprocess.check_output(['git',*args], text=not binary)
def fail(message):
 print('NurByte: '+message,file=sys.stderr);raise SystemExit(1)
def assignment():
 try:t=json.loads(Path('.nurbyte/task.json').read_text())
 except (OSError,ValueError):fail('Brak przydziału. Uruchom .nurbyte/task.py.')
 branch=git('branch','--show-current').strip()
 if branch in ['dev','master'] or branch!=t.get('branch'):fail('Gałąź jest poza przydziałem lub chroniona.')
 if not re.fullmatch(r'(feat|fix|hotfix|refactor|perf|test|docs|build|ci|chore)/[0-9][0-9A-Za-z.+-]*/[a-z0-9][a-z0-9-]*',branch):fail('Nieprawidłowa nazwa gałęzi zadania.')
 return t,branch

def sensitive(data):
 # Heuristics only. Never return or print matched values.
 text=data.decode('utf-8',errors='replace')
 if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text):return True
 if re.search(r'\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})\b',text):return True
 # Contextual candidate detection; intentionally errs towards blocking.
 if re.search(r'(?i)(?:api[_-]?key|secret|password|token)\s*[:=]\s*[\'\"][A-Za-z0-9_+/=.-]{16,}[\'\"]',text):return True
 for m in re.finditer(r'(?<!\d)\d{11}(?!\d)',text):
  v=[int(c) for c in m.group()]
  if (10-sum(a*b for a,b in zip(v[:10],[1,3,7,9,1,3,7,9,1,3]))%10)%10==v[-1]:return True
 return False

def scan_index():
 paths=git('diff','--cached','--name-only','--diff-filter=ACMR','-z',binary=True).split(b'\0')
 for raw in paths:
  if not raw:continue
  name=os.fsdecode(raw);p=Path(name)
  if p.name.startswith('.env') and p.name not in ['.env.example','.env.sample','.env.template']:fail('Zablokowano plik środowiskowy w indeksie.')
  if p.suffix.lower() in ['.pem','.p12','.pfx','.key'] or p.name in ['id_rsa','id_ed25519']:fail('Zablokowano możliwy plik klucza.')
  if any(x in p.parts for x in ['node_modules','.next','.vercel']):fail('Zablokowano plik wygenerowany lub konfigurację lokalną.')
  data=git('show',':'+name,binary=True)
  if len(data)>10*1024*1024:fail('Plik ponad 10 MiB wymaga osobnego przeglądu poza zwykłym commitem.')
  if sensitive(data):fail('Wykryto możliwy sekret lub PESEL w indeksie; sprawdź lokalnie staged diff. Wartości nie pokazano.')

def main():
 mode=sys.argv[1]
 # Human-only local commit checks are disabled by explicit user instruction.
 # This marker is not a security boundary; the agent must never strip it.
 agent_context = os.environ.get('NURBYTE_AGENT') == '1' or bool(os.environ.get('CODEX_THREAD_ID'))
 if mode in ('pre-commit', 'commit-msg', 'pre-push') and not agent_context:
  return
 if mode=='commit-msg':
  msg=Path(sys.argv[2]).read_text().splitlines()[0]
  if not re.fullmatch(r'(feat|fix|refactor|perf|test|docs|build|ci|chore|revert)\((hosts-editor|bo|docflow|website|tooling)\)!?: .{3,100}',msg):fail('Format: type(scope): opis. Scope: hosts-editor/bo/docflow/website/tooling.')
 elif mode=='pre-commit':
  assignment();scan_index()
 elif mode=='pre-push':
  if os.environ.get('NURBYTE_APPROVED_DELETE_SHA'):
   task=json.loads(Path('.nurbyte/task.json').read_text());branch=task['branch'];base=task['base'];sha=os.environ['NURBYTE_APPROVED_DELETE_SHA']
   if base not in ('dev','master') or branch in ('dev','master') or os.environ.get('NURBYTE_DELETE_TARGET')!=base:fail('Invalid cleanup scope.')
   if git('rev-parse','refs/heads/'+branch).strip()!=sha:fail('Source changed; cleanup blocked.')
   if subprocess.run(['git','merge-base','--is-ancestor',sha,'refs/remotes/origin/'+base]).returncode:fail('Source not merged; cleanup blocked.')
   lines=sys.stdin.read().splitlines()
   if len(lines)!=1:fail('Cleanup permits one ref only.')
   parts=lines[0].split()
   if len(parts)!=4 or parts[1]!='0'*40 or parts[2]!='refs/heads/'+branch or parts[3]!=sha:fail('Cleanup ref/SHA mismatch.')
   return
  _,branch=assignment();head=git('rev-parse','HEAD').strip()
  if os.environ.get('NURBYTE_APPROVED_PUSH_SHA')!=head:fail('Push zablokowany. Po zgodzie użytkownika uruchom .nurbyte/push.py w terminalu.')
  for line in sys.stdin:
   parts=line.split()
   if len(parts)!=4:fail('Niepoprawny opis push.')
   src,sha,dst,_=parts
   if src not in ('refs/heads/'+branch, 'HEAD', head) or dst!='refs/heads/'+branch or sha!=head:fail('Push musi obejmować wyłącznie HEAD przydzielonej gałęzi; bez tagów/usuwania.')
 else:fail('Nieznany tryb hooka.')
if __name__=='__main__':main()
