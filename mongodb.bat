rem C:\>netstat -aon|findstr "27017端口号"
:: C:\>tasklist|findstr "123进程号" 
rem C:\>taskkill /pid 27017进程号
c:\mongodb\bin\mongod --dbpath c:\mongodb\data --logpath C:\mongodb\logs\mongod.log --install
net start MongoDB