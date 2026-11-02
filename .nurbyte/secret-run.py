#!/usr/bin/env python3
"""Prompt locally; inject into child env; redact exact values from captured output.
NOT a sandbox, outbound network filter, arbitrary encoding detector, or log cleaner.
Run by the human in a separate terminal, never via a model tool call.
"""
import argparse,getpass,os,re,subprocess,sys
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--name',action='append',required=True);p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args()
cmd=a.command[1:] if a.command[:1]==['--'] else a.command
if not sys.stdin.isatty() or not sys.stderr.isatty():p.error('Uruchom osobiście w osobnym terminalu; nie jako narzędzie agenta.')
if not cmd or any(not re.fullmatch(r'[A-Z][A-Z0-9_]*',n) for n in a.name):p.error('Podaj nazwy zmiennych i polecenie po --.')
print('Tylko zaufane lokalne polecenia. Proces może zapisać/wysłać sekret; ten pomocnik tego nie blokuje.',file=sys.stderr)
env=os.environ.copy();mapping={}
for name in a.name:
 value=getpass.getpass(name+' (ukryte): ')
 if len(value)<8:p.error('Wartość zbyt krótka dla tego pomocnika.')
 mapping[value]='<'+name+'>';env[name]=value
# Capture before display: avoids splitting a secret across printed chunks.
# Intended for short jobs, not long-running servers; output stays in RAM.
try:r=subprocess.run(cmd,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=300)
except (OSError,subprocess.TimeoutExpired):print('Nie uruchomiono lub przekroczono 300 s; wynik ukryty.',file=sys.stderr);raise SystemExit(1)
for data,target in [(r.stdout,sys.stdout),(r.stderr,sys.stderr)]:
 text=data.decode('utf-8',errors='replace')
 for value in sorted(mapping,key=len,reverse=True):text=text.replace(value,mapping[value])
 text=re.sub(r'(?<!\d)\d{11}(?!\d)','<POTENTIAL_PESEL>',text)
 target.write(text)
raise SystemExit(r.returncode)
