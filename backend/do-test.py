import subprocess
from os import listdir
from os.path import isfile, join

# filepath = "some/complete/path/to/file"
# hostname = "user@remote_system"
# remote_path = "some/remote/path"

subprocess.call(['pwd'])
subprocess.call(['ls'])
subprocess.Popen(['scp', "-i ./travis_digitalocean", "-o StrictHostKeyChecking=no", "-rp", "root@188.166.231.42:/scremsong/logs/", "./"]).wait()
print(">> scp done")
print()

subprocess.call(['ls'])
print(">> ls done")
print()

subprocess.call(['ls', 'logs'])
print(">> ls logs done")
print()

mypath = "/scremsong/logs/"
onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
print(onlyfiles)
print(">> file listing donne")
print()

# print(subprocess.call(['ls', "buld"]))
# scp -i ./travis_digitalocean -o StrictHostKeyChecking=no -rp root@209.97.166.142:/scremsong/app/build/ ./
