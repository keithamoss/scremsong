import subprocess

# filepath = "some/complete/path/to/file"
# hostname = "user@remote_system"
# remote_path = "some/remote/path"

subprocess.call(['pwd'])
subprocess.call(['ls'])
print(subprocess.Popen(['scp', "-i ./travis_digitalocean", "-o StrictHostKeyChecking=no", "-rp", "root@209.97.166.142:/scremsong/app/build/", "./"]).wait())
print(subprocess.call(['ls']))
print(subprocess.call(['ls', "buld"]))
# scp -i ./travis_digitalocean -o StrictHostKeyChecking=no -rp root@209.97.166.142:/scremsong/app/build/ ./
