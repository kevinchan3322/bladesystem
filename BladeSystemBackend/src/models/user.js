const mongoose = require('mongoose');
const argon2 = require('argon2');

const UserSchema = new mongoose.Schema(
    {
        account: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            sparse: true,
            unique: true
        },
        password: {
            type: String,
            required: function() {
                return !this.isGoogleUser;
            }
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true
        },
        isGoogleUser: {
            type: Boolean,
            default: false
        }
    },
    { minimize: false }
);

UserSchema.pre('save', async function (next) {
    if (!this.isGoogleUser && (this.isNew || this.isModified('password'))) {
        const hash = await argon2.hash(this.password);
        this.password = hash;
    }
    next();
});

UserSchema.methods.isValidPassword = async function (password) {
    const user = this;
    if (user.isGoogleUser) {
        return false;
    }
    const compare = await argon2.verify(user.password, password);
    return compare;
};

const UserModel = mongoose.model('Users', UserSchema, 'Users');

module.exports = { UserModel };
