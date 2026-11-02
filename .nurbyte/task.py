#!/usr/bin/env python3
import argparse,hashlib,json,re,subprocess
from pathlib import Path
p=argparse.ArgumentParser(description='Create assigned task branch; never switches to another base checkout.')
p.add_argument('--setup',action='store_true',help='Allow only unchanged installer-generated files for first setup task.')
p.add_argument('base',choices=['dev','master']);p.add_argument('kind',choices=['feat','fix','hotfix','refactor','perf','test','docs','build','ci','chore']);p.add_argument('version');p.add_argument('slug');a=p.parse_args()
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
if git('status','--porcelain'):
 if not a.setup:p.error('Katalog ma istniejące zmiany. Zachowaj je i ustal przydział; narzędzie niczego nie czyści.')
 try:manifest=json.loads(Path('.nurbyte/bootstrap.json').read_text())
 except (OSError,ValueError):p.error('Brak manifestu instalatora.')
 changed=subprocess.check_output(['git','ls-files','--modified','--others','--exclude-standard','-z']).decode().split('\0')
 for f in filter(None,changed):
  if f=='.nurbyte/bootstrap.json':continue
  if f not in manifest or not Path(f).is_file() or hashlib.sha256(Path(f).read_bytes()).hexdigest()!=manifest[f]:p.error('Zmiany poza oryginalnym pakietem instalacyjnym; sprawdź lokalnie.')
if git('branch','--show-current')!=a.base:p.error('Bieżąca gałąź musi być przypisaną bazą. Nie przełączam środowiska za Ciebie.')
if not re.fullmatch(r'[0-9][0-9A-Za-z.+-]*',a.version) or not re.fullmatch(r'[a-z0-9][a-z0-9-]*',a.slug):p.error('Nieprawidłowa wersja/slug.')
if (a.kind=='hotfix') != (a.base=='master'):p.error('hotfix bazuje na master; pozostałe typy na dev.')
branch=f'{a.kind}/{a.version}/{a.slug}'
base_sha=git('rev-parse','HEAD')
subprocess.run(['git','switch','-c',branch],check=True)
Path('.nurbyte/task.json').write_text(json.dumps({'base':a.base,'base_sha':base_sha,'branch':branch},indent=2)+'\n')
print('Przydział zapisany: '+branch+'. Nie zmieniono numeru aplikacji ani zdalnych gałęzi.')
