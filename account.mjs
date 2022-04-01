import mongoose from 'mongoose'

const account = new mongoose.Schema({
	username: { type: String, minLength: 1, maxLength: 30, required: true, cast: false, unique: true },
	passwordHash: { type: Buffer, required: true },
	salt: { type: Buffer, required: true },
	createdAt: { type: Date, immutable: true },
	updatedAt: { type: Date, immutable: true }
}, { strict: 'throw', timestamps: true })

const Account = mongoose.model('account', account)

export { Account }
