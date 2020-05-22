---
layout: post
title: "Virtualbox CentOS Disk 용량 늘리기"
description: "Correcting the Insufficient Capacity of CentOS Disks in Virtual Box"
excerpt: "Virtualbox에서 CentOS 용량이 부족한 경우 해결하기"
category: Study
comments: true
---

리눅스 환경에서 개발 하는 것을 개인적으로 선호한다. 대부분의 프로그램들이 리눅스 서버에서 동작하기도 하며, 
많은 오픈 소스들이 리눅스 환경에서 개발이 되었기 때문이다. 맥북으로 개발을 하고 싶지만, ~~맥북을 안사주는 회사..~~, 그리고 개인적으로는 비싸서...
윈도우에서는 가상 머신으로 개발환경을 구축하곤 한다. 빅데이터 플랫폼 파일럿 프로젝트를 진행하면서, 
Virtualbox의 용량을 20GB 로 하였지만.. Disk Full 현상을 만나게 되었고, 여유롭게 40GB로 확장하는 방법을 정리해보았다. 

<br>

### 용량 확인
---
```{.bash}
[root@server02 cloudera-scm-server]# df -h
Filesystem            Size  Used Avail Use% Mounted on
/dev/mapper/vg_develop-lv_root
                       18G   15G  1.4G  92% /
tmpfs                 3.9G   72K  3.9G   1% /dev/shm
/dev/sda1             477M   79M  373M  18% /boot
cm_processes          3.9G   12M  3.9G   1% /var/run/cloudera-scm-agent/process
```

<br>

### Step1. 가상머신 전원 Off
---

![disk]({{site.baseurl}}/img/post/study/virtualbox/disk.png)

<br>

### Step2. Windows 명령 프롬프트에서 VirtualBox가 설치 된 폴더로 이동
---
VirtualBox를 설치할 때 default로 설치하였다면, **C:\Program Files\Oracle\VirtualBox** 의 경로에 설치 되어 있다.

<br>

### Step3. 가상 디스크 파일의 크기를 조정하는 명령어를 입력한다. 
---
```{.bash}
VBoxManage modifyhd "D:\Disk\VM\centos2\centos2.vdi" --resize 40960
```

![cmd]({{site.baseurl}}/img/post/study/virtualbox/cmd.png)

<br>

### Step4. VirtualBox 실행 후 용량 확인 
---
```{.bash}
root@server02 develop]# fdisk -l
Disk /dev/sda: 42.9 GB, 42949672960 bytes
255 heads, 63 sectors/track, 5221 cylinders
Units = cylinders of 16065 * 512 = 8225280 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk identifier: 0x000aab80
```

<br>

### Step5. 파티션 설정 
---

```{.bash}
[root@server02 develop]# fdisk /dev/sda
WARNING: DOS-compatible mode is deprecated. It's strongly recommended to
         switch off the mode (command 'c') and change display units to
         sectors (command 'u').
Command (m for help): p
Disk /dev/sda: 42.9 GB, 42949672960 bytes
255 heads, 63 sectors/track, 5221 cylinders
Units = cylinders of 16065 * 512 = 8225280 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk identifier: 0x000aab80
   Device Boot      Start         End      Blocks   Id  System
/dev/sda1   *           1          64      512000   83  Linux
Partition 1 does not end on cylinder boundary.
/dev/sda2              64        2611    20458496   8e  Linux LVM
Command (m for help): n
Command action
   e   extended
   p   primary partition (1-4)
p
Partition number (1-4): 3
First cylinder (2611-5221, default 2611): 2611
Last cylinder, +cylinders or +size{K,M,G} (2611-5221, default 5221): 5221
Command (m for help): t
Partition number (1-4): 3
Hex code (type L to list codes): 0x8e
Type 0 means free space to many systems
(but not to Linux). Having partitions of
type 0 is probably unwise. You can delete
a partition using the `d' command.
Changed system type of partition 3 to 0 (Empty)
Command (m for help): w
The partition table has been altered!
Calling ioctl() to re-read partition table.
WARNING: Re-reading the partition table failed with error 16: 장치나 자원이 동작 중.
The kernel still uses the old table. The new table will be used at
the next reboot or after you run partprobe(8) or kpartx(8)
Syncing disks.
```


<br>

### Step6. 가상머신 OS 재부팅 
---

```{.bash}
[root@server02 develop]# reboot
```

<br>

### Step7. 새로운 물리 볼륨 생성(볼륨을 sda3으로 생성) 
---

```{.bash}
[root@server02 develop]# pvcreate /dev/sda3
  Physical volume "/dev/sda3" successfully created
[root@server02 develop]# vgextend vg_develop-ly_root /dev/sda3
```

<br>

### Step8. 새 파티션을 볼륨 그룹에 추가 
---

```{.bash}
[root@server02 develop]# vgextend vg_develop /dev/sda3
  Found duplicate PV xwu1FT418a7uKRvasGd2z8AmJ9JDXWVI: using /dev/sda4 not /dev/sda3
  Using duplicate PV /dev/sda4 which is last seen, replacing /dev/sda3
  Found duplicate PV xwu1FT418a7uKRvasGd2z8AmJ9JDXWVI: using /dev/sda3 not /dev/sda4
  Using duplicate PV /dev/sda3 which is last seen, replacing /dev/sda4
  Found duplicate PV xwu1FT418a7uKRvasGd2z8AmJ9JDXWVI: using /dev/sda4 not /dev/sda3
  Using duplicate PV /dev/sda4 which is last seen, replacing /dev/sda3
  Found duplicate PV xwu1FT418a7uKRvasGd2z8AmJ9JDXWVI: using /dev/sda3 not /dev/sda4
  Using duplicate PV /dev/sda3 which is last seen, replacing /dev/sda4
  Found duplicate PV xwu1FT418a7uKRvasGd2z8AmJ9JDXWVI: using /dev/sda4 not /dev/sda3
  Using duplicate PV /dev/sda4 which is last seen, replacing /dev/sda3
  Physical volume "/dev/sda3" successfully created
  Volume group "vg_develop" successfully extended
```

<br>

### Step9. 파티션 확장 
---

```{.bash}
[root@server02 develop]# lvextend -L +19G /dev/mapper/vg_develop-lv_root
  Found duplicate PV 3V6e6wnIHbuSgOODKFgVQ1eGV7miy5uC: using /dev/sda4 not /dev/sda3
  Using duplicate PV /dev/sda4 which is last seen, replacing /dev/sda3
  Size of logical volume vg_develop/lv_root changed from 17.51 GiB (4482 extents) to 36.51 GiB (9346 extents).
  Logical volume lv_root successfully resized.
```

<br>

### Step10. 파티션 크기 조정 
---

```{.bash}
[root@server02 develop]# resize2fs /dev/mapper/vg_develop-lv_root
resize2fs 1.41.12 (17-May-2010)
Filesystem at /dev/mapper/vg_develop-lv_root is mounted on /; on-line resizing required
old desc_blocks = 2, new_desc_blocks = 3
Performing an on-line resize of /dev/mapper/vg_develop-lv_root to 9570304 (4k) blocks.
The filesystem on /dev/mapper/vg_develop-lv_root is now 9570304 blocks long.
```

<br>

### Step11. 확인 
---

```{.bash}
[root@server02 develop]# df -h
Filesystem            Size  Used Avail Use% Mounted on
/dev/mapper/vg_develop-lv_root
                       36G   15G   20G  44% /
tmpfs                 3.9G   80K  3.9G   1% /dev/shm
/dev/sda1             477M   79M  373M  18% /boot
cm_processes          3.9G  5.4M  3.9G   1% /var/run/cloudera-scm-agent/process
```