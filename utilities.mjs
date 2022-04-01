import compareVersions from 'compare-versions'
import parser from 'ua-parser-js'

// we can only use browsers that support and enforce SameSite cookie policy
// see: https://caniuse.com/same-site-cookie-attribute
const SUPPORTED_BROWSERS = {
	'Edge': '18',
	'Firefox': '60',
	'Chrome': '51',
	'Safari': '14.1',
	'Opera': '39'
}

// determine if provided user-agent is supported based on version
const isSupportedBrowser = async (req) => {
	let browser = parser(req.headers['user-agent']).browser
	if (browser.name in SUPPORTED_BROWSERS) {
		let versionCompare
		try {
			versionCompare = compareVersions(browser.version, SUPPORTED_BROWSERS[browser.name])
		} catch (e) {}

		if (versionCompare === 1) {
			return true
		}
	}
	return false
}

const ERROR = {
	INVALID_REQUEST: {
		name: 'INVALID_REQUEST',
		status: 400
	},
	UNSUPPORTED_REQUEST: {
		name: 'UNSUPPORTED_REQUEST',
		status: 400
	},
	UNAUTHORIZED: {
		name: 'UNAUTHORIZED',
		status: 401
	},
	FORBIDDEN: {
		name: 'FORBIDDEN',
		status: 403
	},
	NOT_FOUND: {
		name: 'NOT_FOUND',
		status: 404
	},
	NOT_ALLOWED: {
		name: 'NOT_ALLOWED',
		status: 405
	},
	IM_A_TEAPOT: {
		name: 'IM_A_TEAPOT',
		status: 418
	},
	OPERATION_FAILED: {
		name: 'OPERATION_FAILED',
		status: 500
	},
	INTERNAL_ERROR: {
		name: 'INTERNAL_ERROR',
		status: 500
	},
	is: (e, res) => {
		res.should.have.status(e.status)
		res.body.error.should.equal(e.name)
	}
}

class ApiError {
	constructor(args) {
		let { error, message } = Object.assign({ error: ERROR.INTERNAL_ERROR }, args)

		if (message === undefined || message === null) {
			throw Error('Missing message in API error response')
		}

		this.status = error.status
		this.name = error.name
		this.message = message
	}

	async send(res) {
		res.status(this.status).json({
			error: this.name,
			status: this.status,
			message: this.message
		})
	}
}

class ApiResponse {
	constructor(args) {
		let { status, message, details, accessToken, expiresIn } = Object.assign({ status: 200 }, args)

		if (status === undefined || status === null) {
			throw Error('Missing status in API response')
		}
		if (message === undefined || message === null) {
			throw Error('Missing message in API response')
		}
		if (details === undefined || details === null) {
			throw Error('Missing details in API response')
		}

		this.status = status
		this.message = message
		this.details = details
		this.accessToken = accessToken
		this.expiresIn = expiresIn
	}

	async send(res) {
		let response = {
			message: this.message,
			status: this.status,
			details: this.details,
		}

		if (this.accessToken) {
			response.accessToken = this.accessToken
		}

		if (this.expiresIn) {
			response.expiresIn = this.expiresIn
		}

		res.status(this.status).json(response)
	}
}

export {
	SUPPORTED_BROWSERS,
	isSupportedBrowser,
	ERROR,
	ApiError,
	ApiResponse
}
