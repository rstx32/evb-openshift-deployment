// create dataList database for admin
db = db.getSiblingDB('dataList')
db.createUser({
  user: 'rstx',
  pwd: 'xtsr',
  roles: [
    {
      role: 'readWrite',
      db: 'dataList',
    },
  ],
})