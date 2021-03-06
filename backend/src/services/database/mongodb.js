function MongoDB() {

    const mongoose = require("mongoose")
    const logger = require("../log")
    const bcrypt = require("bcrypt")
    
    const User = require("../../models/user")
    const ExternalUser = require("../../models/externalUser")


    const connectionString = process.env.DB_CONNECTION_STRING

    this.connect = () => {

        mongoose.connection.on("error", function(err) {
            logger.error("Database connection error: " + err);
        });

        mongoose.connection.on("disconnected", function() {
            logger.info("Database disconnected");
        });

        process.on('SIGINT', function() {
            mongoose.connection.close(function() {
                logger.info('Database process terminated');
                process.exit(0);
            });
        });

        if (!connectionString) {
            throw new Error("Impossible to connect to MongoDB database: connection string not stabilished")
        }

        return mongoose.connect(connectionString)
    }

    this.close = () => {
        mongoose.connection.close();
    }

    this.getUser = (id) => {
        if (!id) {
            throw "id cannot be null or undefined"
        }

        return User.findById(id)
            .then((user) => {
                return user?.toJSON()
            })
    }

    this.deleteUser = (id) => {
        if (!id) {
            throw "id cannot be null or undefined"
        }

        return User.findByIdAndDelete(id)
            .then((deletedUser) => {
                if (!deletedUser) {
                    throw `User not found`
                }
                logger.info(`User with id "${id}" succesfully deleted`)
                return deletedUser?.toJSON()
            })
    }

    this.updateUser = (id, updateFields) => {
        if (!id) {
            throw "id cannot be null or undefined"
        }

        return User.findByIdAndUpdate(id, updateFields, { new: true })
            .then((updatedUser) => {
                logger.info(`User with id "${id}" succesfully updated`)
                return updatedUser?.toJSON()
            })
    }

    this.addUser = async (user) => {
        if (!user) {
            throw "user cannot be null or undefined"
        }
        const { fullname, email, password } = user;
        if (!email) {
            throw "email field cannot be null or undefined"
        }

        const saltRounds = 10
        const passwordHashed = password ? await bcrypt.hash(password, saltRounds) : null

        const newUser = new User({
            fullname: fullname || "",
            email: email,
            password: passwordHashed || "",
        })

        return newUser.save()
            .then((savedUser) => {
                logger.info(`User with email [${savedUser.email}] succesfully created`)
                return savedUser?.toJSON()
            })
    }

    this.getUserByEmail = (email) => {
        if (!email) {
            throw "email cannot be null or undefined"
        }

        return User.findOne({email: email})
            .then((user) => {
                return user?.toJSON()
            })
    }

    this.getExternalUserById = (id) => {
        if (!id) {
            throw "id cannot be null or undefined"
        }

        return ExternalUser.findById(id)
            .then((user) => {
                return user?.toJSON()
            })
    }

    this.getExternalUser = (userId, provider) => {
        if (!userId || !provider) {
            throw "id cannot be null or undefined"
        }

        return ExternalUser.findOne({userId: userId, providerName: provider})
            .then((user) => {
                return user?.toJSON()
            })
    }

    this.addExternalUser = async (user) => {
        if (!user) {
            throw "user cannot be null or undefined"
        }
        let { userId, providerUserId, providerName, loginName, picture } = user

        if (!userId) {
            throw "userId fields cannot be null or undefined"
        }
        if (!providerUserId) {
            throw "providerUserId fields cannot be null or undefined"
        }
        if (!providerName) {
            throw "providerName fields cannot be null or undefined"
        }

        const newExternalUser = new ExternalUser({
            userId: userId,
            providerUserId: providerUserId,
            providerName: providerName,
            loginName: loginName || "",
            picture: picture || ""
        })

        console.log(newExternalUser.toJSON())

        return newExternalUser.save()
            .then((savedUser) => {
                logger.info(`User succesfully registered from ${savedUser.providerName} OAuth 2.0`)
                return savedUser?.toJSON()
            })
    }


    this.getUsers = () => {
        return User.find({})
            .then((users) => {
                return users
            })
    }
}

module.exports = MongoDB