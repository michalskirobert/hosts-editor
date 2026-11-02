#!/usr/bin/env python3
"""Push only the explicitly approved committed HEAD; preserve all working changes.
Local approval arguments/markers are not a tamper-proof human identity boundary.
"""
import argparse,os,subprocess
from guard import assignment,git,fail
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--approved-sha',help='Exact full HEAD, only after user/tool consent for this operation.')
p.add_argument('--check-only',action='store_true',help='Inspect the plan without approval, push or remote access.')
a=p.parse_args()
_,branch=assignment();head=git('rev-parse','HEAD').strip()
print('Push origin / '+branch+' / commit '+head)
print('Push sends committed HEAD only. Staged, unstaged and untracked files are not sent or changed.')
print('May trigger CI/Preview. Does not authorize merge, tags or production.')
if a.approved_sha is not None and a.approved_sha!=head:fail('Approved SHA differs from current HEAD.')
if a.check_only:
 print('CHECK ONLY: no push, no remote connection, no index changes.');raise SystemExit(0)
if a.approved_sha is None:
 try:
  with open('/dev/tty','r+') as tty:
   tty.write('Confirm PUSH '+head[:12]+': ');tty.flush();answer=tty.readline().strip()
 except OSError:fail('No user terminal. Obtain explicit consent and use --approved-sha for the exact operation.')
 if answer!='PUSH '+head[:12]:fail('Not confirmed.')
# Check again after the user prompt; never change branches or clean/stage files.
_,now=assignment()
if now!=branch or git('rev-parse','HEAD').strip()!=head:fail('Branch/HEAD changed after confirmation.')
env=os.environ.copy();env['NURBYTE_APPROVED_PUSH_SHA']=head
raise SystemExit(subprocess.run(['git','push','--set-upstream','origin',head+':refs/heads/'+branch],env=env).returncode)
