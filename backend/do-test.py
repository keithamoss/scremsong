import subprocess
from os import listdir
from os.path import isfile, join

# filepath = "some/complete/path/to/file"
# hostname = "user@remote_system"
# remote_path = "some/remote/path"

out = subprocess.check_output(['pwd'])
print(out)
print(">> pwd done")
print()

out = subprocess.check_output(['ls'])
print(out)
print(">> ls done")
print()

out = subprocess.check_output(['scp', "-i ./travis_digitalocean", "-o StrictHostKeyChecking=no", "-rp", "root@139.59.251.69:/scremsong/logs/", "./"])
print(out)
print(">> scp done")
print()

out = subprocess.check_output(['ls'])
print(out)
print(">> ls done")
print()

out = subprocess.check_output(['ls', './logs'])
print(out)
print(">> ls logs done")
print()

mypath = "./logs"
onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
print(onlyfiles)
print(">> file listing donne")
print()

# print(subprocess.call(['ls', "buld"]))
# scp -i ./travis_digitalocean -o StrictHostKeyChecking=no -rp root@209.97.166.142:/scremsong/app/build/ ./
