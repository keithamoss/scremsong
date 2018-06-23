from setuptools import setup, find_packages

setup(
    author="Keith Moss",
    author_email="keithamoss@gmail.com",
    description="scremsong",
    license="GPL3",
    keywords="",
    url="https://github.com/keithmoss/scremsong",
    name="scremsong",
    version="0.1.0",
    packages=find_packages(exclude=["*.tests", "*.tests.*", "tests.*", "tests"]),
)
