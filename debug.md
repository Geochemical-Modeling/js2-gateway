

### Issue 1
Yeah the main issue was that we were calling "/api/co2" instead of "/api/co2/" which was garbage. Hopefully I can fix everything by tomorrow and get this over with, but I'm glad that I finally figured out that bug.

I fixed it by making co2_calc interceptor's router.get("")

### Issue 2: CO2 Fortran binary main not found issue (and fix)
Our Python web app is running Alpine Linux (via a Docker container), which is needed for our UV package manager. This app needs to execute a Fortran binary called `main`, which performs CO2 solubility calculations. Even though `main` is present in the file system, and marked as executable (we gave file perms in `Dockerfile`), we had issues running it. So first we saw that when our web app tried to run the file, we got an "Permission denied" error. Then after doing docker exec inside the container, we saw that the `main` binary didn't have execution permissions. That's straight forward, we just need to give the container execution permissions.

```Dockerfile 
# Give the owner (root) read, write, and run permissions for anything inside the app. This 
# is fine, the container is isolated, it's not messing with our host machine stuff, etc.
RUN --chmod=755 /app
```
But now when trying to run the binary, we're getting "File not found", which is different and a little misleading. We went into our container and ran some commands
```bash

# Runs and shows the file exists; we can see it's exists and can be executed 
# Output -rwxr-xr-x 1 root root 22352 Apr 19 04:43 main
ls -l main

# Tries to execute binary but we get output: /bin/sh: ./main: not found
./main

# Tries to see what type of file it is; we know it's a fortran binary from outside knowledge 
# output: /bin/sh: file: not found
file ./main

# What's going on here?
```
Even though the file exists and has execution permissions, it's not showing it's there. It's not running. This can happen when a binary depends on other files (shared libraries), and those dependencies aren't available in the container. So those "file not found" messages were a bit misleading. Here's how we found the dependencies weren't there:
```Bash

# Check the dependencies the binary needs to run
ldd ./main

# Here's the output. We're missing stuff. It means the binary is dynamically linked, and needs certain runtime libraries to work.
# IBM Article: https://www.ibm.com/docs/en/openxl-c-and-cpp-aix/17.1.3?topic=cc-dynamic-static-linking
        /lib64/ld-linux-x86-64.so.2 (0x7f113f6ce000)
Error loading shared library libgfortran.so.5: No such file or directory (needed by ./main)
        libm.so.6 => /lib64/ld-linux-x86-64.so.2 (0x7f113f6ce000)
Error loading shared library libgcc_s.so.1: No such file or directory (needed by ./main)
        libc.so.6 => /lib64/ld-linux-x86-64.so.2 (0x7f113f6ce000)
Error relocating ./main: _gfortran_transfer_real_write: symbol not found
Error relocating ./main: _gfortran_st_read_done: symbol not found
Error relocating ./main: _gfortran_transfer_real: symbol not found
Error relocating ./main: _gfortran_transfer_character_write: symbol not found
Error relocating ./main: _gfortran_st_read: symbol not found
Error relocating ./main: __powidf2: symbol not found
Error relocating ./main: _gfortran_st_write_done: symbol not found
Error relocating ./main: _gfortran_set_options: symbol not found
Error relocating ./main: _gfortran_set_args: symbol not found
Error relocating ./main: _gfortran_st_write: symbol not found
```
We're running our app in an Alpine Linux container, which is minimal and uses a library called musl instead of the usual glibc used by most Linux distros. Our FOrtran library was compiled in glibc so it expects glibc to be here. However since Alpine doesn't have that, it's not going to work. To solve this, we'll install `gcompat`, which is a compatibility layer for glib on musl systems. 
```Dockerfile

# Just add this line
RUN apk add --no--cache libgcc libgfortran gcompat

```
Now exec into the container and try running the program:
```bash

# Run program; and 
./main

# Your output will look like this, which is good:
 ---------CO2 solubility in aqueous NaCl solution---------
 ref: Duan Z, Sun R, Zhu C, Chou I (Marine Chemistry, 2006, v98, 131-139)
   T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl
   Unit---T: K, P(total): bar, mNaCl and mCO2: mol/kgH2O
 -------------------------------------------------------
 Please enter temperature(K), pressure(bar) and mNaCl(m)
```
Let me explain what each of those do again:
  - `gfortran`: This is a Gnu Fortran compiler, so you'll need this if iyou're compiling Fortran code inside the docker container. However if you are just running a precompiled binary you don't need this. So this is not needed since we're only running pre-compiled binaries, but I'll still  mention it in case someone in the future wants to add the fortran source code here and compile them here.  
  - `libgfortran`: A runtime library used by Fortran programs compiled with `gfortran`. It's required if your binary was compiled with `gfortran` and uses its features, which most do. And finally we also know it's necessary since it was present in the ldd error logs.
  - `libgcc`: GCC runtime support, needed for exception handling and other routines. Honestly you don't really need to know this in-depth, all you know is it's a dependency that was listed on `ldd` command for things that were missing so we add i.
  - `gcompat`: Alpine uses `musl libc` instead of `glibc`, and most binaries (like ours) expect `glibc`. This piece of software is a compatibility layer that lets glibc compiled binaries run on `musl` and therefore Alpine. 

So in summary, Alpine uses musl to compile bianries, but many programs (like our Fortran binary) are compiled with glibc. We can install `gcompat` to let these glibc-compiled binaries run properly on Alpine by mimicking teh behavior and structure glic-based programs expect. So for future developers, here's some advice:

If you're using Alpine Linux and a precompiled binary gives a weird "file not found" error, even though the file is clearly there:
- Run ldd to check dependencies
- Make sure required libraries are installed
- On Alpine, install gcompat to run glibc-compiled programs

### Issue 3: Phreeqc Fortran Binary, limitations of gcompat 
Now let's try to run and analyze our `phreeqc` fortran binary within container.

```bash
/app/app/routes/phreeqc # file ./phreeqc
/bin/sh: file: not found

/app/app/routes/phreeqc # ./phreeqc
Error loading shared library libstdc++.so.6: No such file or directory (needed by /app/app/routes/phreeqc/phreeqc)
Error relocating /app/app/routes/phreeqc/phreeqc: _ZNSs6appendEPKcm: symbol not found
Error relocating /app/app/routes/phreeqc/phreeqc: _ZSt7getlineIcSt11char_traitsIcESaIcEERSt13basic_istreamIT_T0_ES7_RSbIS4_S5_T1_ES4_: symbol not found
Error relocating /app/app/routes/phreeqc/phreeqc: _ZNSolsEi: symbol not found
Error relocating /app/app/routes/phreeqc/phreeqc: _ZNSs5clearEv: symbol not found
Error relocating /app/app/routes/phreeqc/phreeqc: _ZSt18_Rb_tree_decrementPKSt18_Rb_tree_node_base: symbol not found
Error relocating /app/app/routes/phreeqc/phreeqc: _ZSt16__throw_bad_castv: symbol not found
... # It went on for another 100 lines or so
/app/app/routes/phreeqc # ldd ./phreeqc
        /lib64/ld-linux-x86-64.so.2 (0x7f456338f000)
Error loading shared library libstdc++.so.6: No such file or directory (needed by ./phreeqc)
        libm.so.6 => /lib64/ld-linux-x86-64.so.2 (0x7f456338f000)
        libgcc_s.so.1 => /usr/lib/libgcc_s.so.1 (0x7f4563363000)
        libc.so.6 => /lib64/ld-linux-x86-64.so.2 (0x7f456338f000)
Error relocating ./phreeqc: _ZNSs6appendEPKcm: symbol not found
```
Let's review. Alpine Linux is a popular minimal base image known for its small size. However, it uses musl libc as its C standard library, which differs from the more widely-used glibc. This discrepancy creates compatibility issues when trying to run precompiled binaries that were compiled with glibc whilst on Alpine. Phreeqc and other Fortran binaries, in particular, are typically compiled with glibc, meaning they rely on glibc-specific functions and libraries that are not available in musl. For instance, the absence of important shared libraries like libstdc++.so.6 (the C++ standard library) causes errors when trying to run these binaries in an Alpine-based container. While gcompat can help bridge some of these gaps by providing partial compatibility with glibc, it does not offer a 100% solution. There will always be some legacy functions or specific glibc features that gcompat cannot replicate, leading to potential runtime issues. So we've reached our limit with gcompat.

To fix this, we'll switch the project to a Debian-based image, which is a widely used Linux distro that utilizes glibc by default. This will ensure that binaries compiled with glibc, will run smoothly in the container. After running the container in Debian, we can remove stuff like gcompat and even libgcc. However you'll still need libgfortan5 to run the CO2 binary. This is just an example of how certain libraries may still be required to run specific binaries. The switch to debian isn't only about solving this one problem, but it's also the idea of dealing with issues down the lnie. Like handling more binaries like supcrtbl or whatever the project needs, being on debian will make it easier to handle those binaries.


## Docker debugging commands
```bash
# Logs up to a certain point in time 
docker logs <container-id-or-name>

# Real time logs  
docker logs -f <container_id_or_name>



# Explore container's file structure
docker exec -it <container_name_or_id> /bin/sh

# Give full permissions inside the app directory
# I guess just give it to the owners
RUN --chmod=755 /app


# This works, we can find the file from the root
# So maybe it's an issue of the CWD/
ls -l /app/app/routes/co2/main

# 1. The binary does exist at the location
docker exec -it 4c001d9776db ls -l /app/app/routes/co2/main

# However when we try to

# 2. Now this doesn't always mean the file is missing, but can also mean that the binary depends on a shared library or interpreter to run it. Now that interpreter may not be available in the container. So we get the output that the libgfortran.so.5 doesn't exist. 

# Our binary is in Fortran.
# - Solution 1: Use a non--Alpine base image such as ubuntu, which include sstuff like libgfortran
# - Solution 2: If you have the source code, recompile thing swith static linking so all dependencies are inside binary.
ldd /app/app/routes/co2/main

# For now we need the quick fix; You shuold include this?

RUN apk add --no-cache curl gfortran libgcc libgfortran


```

### Git stuff 

#### Issue 1: Merging

```

<!-- Reset to before the commit, but keep your current stanges -->
git reset --soft HEAD~1
```
