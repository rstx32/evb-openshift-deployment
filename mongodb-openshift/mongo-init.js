// create dataList database for admin
db = db.getSiblingDB('dataList')
db.createUser({
  user: 'myuser',
  pwd: 'mypass',
  roles: [
    {
      role: 'readWrite',
      db: 'dataList',
    },
  ],
})