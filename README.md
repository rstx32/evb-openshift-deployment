# E-voting Blockchain for Openshift deployment

|Component| Description |
|--|--|
| EvB-admin | voter & candidate management |
| EvB-validator | voter & candidate validator |
| EvB-node | node for voting |
| MongoDB | database |
| Mongo Express | mongoDB web management |


## Environment EvB-admin
*http port, ex: "80"*
**HTTP_PORT**

*mongodb url, ex: "mongodb://username:password@localhost:27017/databaseName"*
**MONGODB_URL**

*a random string, ex: "iawgn98ah4gawn"*
**SESSION_SECRET**

*a random string, ex: "ybgaiwrbg987igun"*
**JWT**

*admin username default registration, ex: "admin"*
**USERNAME_ADMIN**

*admin email default registration, ex: "admin@gmail.com"*
**EMAIL_ADMIN**

*fake email service username, ex: "iinbagwiry"*
**USERNAME_EMAIL**

*fake email service password, ex: "ing47hgfi2"*
**PASSWORD_EMAIL**

## Environment EvB-validator
*http port, ex: "80"*
**HTTP_PORT**

*evb-admin url, ex: "localhost:8080"*
**API_URL**

*mongodb url, ex: "mongodb://username:password@localhost:27017/databaseName"*
**MONGODB_URL**

*public url, ex: "localhost:8080"*
**PUBLIC_URL**

*a random string, ex: "iawgn98ah4gawn"*
**SESSION_SECRET**

*a random string, ex: "ybgaiwrbg987igun"*
**JWT**

*account for validator, format: username email, ex: "validatorA validatora@gmail.com *validatorB validatorb@gmail.com"
**ACCOUNT**

*fake email service username, ex: "iinbagwiry"*
**USERNAME_EMAIL**

*fake email service password, ex: "ing47hgfi2"*
**PASSWORD_EMAIL**

## Environment EvB-node
*http port, ex: "80"*
**HTTP_PORT**

*evb-admin url, ex: "localhost:8080"*
**API_URL**

*a random string, ex: "iawgn98ah4gawn"*
**SESSION_SECRET**

*a random string, ex: "ybgaiwrbg987igun"*
**JWT**

*number to challenge for creating block, ex: "5"*
**DIFFICULTY**

*name of this node, ex: "evb-node1"*
**NODE_ID**

*evb-admin link for public accessible, ex: "localhost:8080"*
**PUBLIC_URL**