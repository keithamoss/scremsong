import subprocess
from os import listdir
from os.path import isfile, join

# filepath = "some/complete/path/to/file"
# hostname = "user@remote_system"
# remote_path = "some/remote/path"

# out = subprocess.check_output(['pwd'])
# print(out)
# print(">> pwd done")
# print()

# out = subprocess.check_output(['ls'])
# print(out)
# print(">> ls done")
# print()

subprocess.check_output(["scp", "-i ./deploy_key", "-o StrictHostKeyChecking=no", "-rp", "root@209.97.171.53:/scremsong/logs/nginx/", "./logs/nginx/"])
print(">> scp done")
print()

# out = subprocess.check_output(['ls'])
# print(out)
# print(">> ls done")
# print()

# out = subprocess.check_output(['ls', './logs'])
# print(out)
# print(">> ls logs done")
# print()

mypath = "./logs/nginx/"
onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
print(onlyfiles)
print(">> file listing donne")
print()

# with open("./logs/error.log") as f:
#     print(f.read())
#     print(">> error.log")
#     print()


# with open("./logs/access.log") as f:
#     print(f.read())
#     print(">> access.log")
#     print()
