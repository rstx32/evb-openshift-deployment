# E-voting Blockchain for Openshift deployment

|Component| Description |
|--|--|
| EvB-admin | voter & candidate management |
| EvB-validator | voter & candidate validator |
| EvB-node | node for voting |
| MongoDB | database |
| Mongo Express | mongoDB web management |


## Environment EvB-admin
**HTTP_PORT**, *http port, ex: "80"*

**MONGODB_URL**, *mongodb url, ex: "mongodb://username:password@localhost:27017/databaseName"*

**SESSION_SECRET**, *a random string, ex: "iawgn98ah4gawn"*

**JWT**, *a random string, ex: "ybgaiwrbg987igun"*

**USERNAME_ADMIN**, *admin username default registration, ex: "admin"*

**EMAIL_ADMIN**, *admin email default registration, ex: "admin@gmail.com"*

**USERNAME_EMAIL**, *fake email service username, ex: "iinbagwiry"*

**PASSWORD_EMAIL**, *fake email service password, ex: "ing47hgfi2"*

## Environment EvB-validator
**HTTP_PORT**, *http port, ex: "80"*

**API_URL**, *evb-admin url, ex: "localhost:8080"*

**MONGODB_URL**, *mongodb url, ex: "mongodb://username:password@localhost:27017/databaseName"*

**PUBLIC_URL**, *public url, ex: "localhost:8080"*

**SESSION_SECRET**, *a random string, ex: "iawgn98ah4gawn"*

**JWT**, *a random string, ex: "ybgaiwrbg987igun"*

*account for validator, format: username email, ex: "validatorA validatora@gmail.com
**ACCOUNT**, *validatorB validatorb@gmail.com"

**USERNAME_EMAIL**, *fake email service username, ex: "iinbagwiry"*

**PASSWORD_EMAIL**, *fake email service password, ex: "ing47hgfi2"*

## Environment EvB-node
**HTTP_PORT**, *http port, ex: "80"*

**API_URL**, *evb-admin url, ex: "localhost:8080"*

**SESSION_SECRET**, *a random string, ex: "iawgn98ah4gawn"*

**JWT**, *a random string, ex: "ybgaiwrbg987igun"*

**DIFFICULTY**, *number to challenge for creating block, ex: "5"*

**NODE_ID**, *name of this node, ex: "evb-node1"*

**PUBLIC_URL**, *evb-admin link for public accessible, ex: "localhost:8080"*