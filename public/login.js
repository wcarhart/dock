const init = async () => {
	const loginForm = document.querySelector('#login')
	const createForm = document.querySelector('#create')
	const loginSelect = document.querySelector('#select-login')
	const createSelect = document.querySelector('#select-create')
	const errorText = document.querySelector('#error-text')
	const submitButton = document.querySelector('#submit-button')
	const dockTitle = document.querySelector('#dock-title')
	const dockLogo = document.querySelector('#dock-logo')

	let loginStatus = 'login'
	let GREETINGS = [
		'Howdy!',
		"Top of the mornin' to ya!",
		"Hey there good lookin'",
		'Welcome back!',
		'Ready to get back at it?',
		'How can I help you today?',
		'Almost there!',
		"Mind auth'ing first?",
		"Ready whenever you are"
	]

	// update dock title
	const updateTitle = async (event) => {
		let newText
		do {
			newText = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
		} while (newText === dockTitle.innerText)
		dockTitle.innerText = newText
	}
	await updateTitle()
	dockTitle.addEventListener('click', updateTitle)

	// handle form submission
	submitButton.addEventListener('click', async (event) => {
		if (loginStatus === 'login') {
			await submitLoginForm()
		} else {
			await submitCreateForm()
		}
	})

	// auto submit form on 'Enter'
	document.addEventListener('keyup', async (event) => {
		if (event.keyCode == 13) {
			submitButton.click()
		}
	})

	// handle login form submit
	const submitLoginForm = async () => {
		errorText.innerText = ''
		errorText.style.display = 'none'
		let formData = new FormData(loginForm)
		let response = await fetch('/login', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: formData.get('login-username'),
				password: formData.get('login-password')
			})
		})

		if (response.status === 200) {
			window.location.replace('/')
		} else {
			let json = await response.json()
			errorText.innerText = 'Incorrect username or password'
			errorText.style.display = 'block'
		}
	}

	// handle new account form submit
	const submitCreateForm = async () => {
		errorText.innerText = ''
		errorText.style.display = 'none'
		let formData = new FormData(createForm)
		let response = await fetch('/account', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				'creation': formData.get('special-password')
			},
			body: JSON.stringify({
				username: formData.get('create-username'),
				password: formData.get('create-password')
			})
		})

		if (response.status === 201) {
			window.location.replace('/')
		} else {
			let json = await response.json()
			errorText.innerText = 'Account creation failed'
			errorText.style.display = 'block'
		}
	}

	// update form based on selector
	const updateForm = async (status) => {
		errorText.style.display = 'none'
		if (loginStatus === 'login') {
			createForm.style.display = 'none'
			loginForm.style.display = 'block'
			loginSelect.classList.remove('form-selector-inactive')
			loginSelect.classList.add('form-selector-active')
			createSelect.classList.add('form-selector-inactive')
			createSelect.classList.remove('form-selector-active')
		} else {
			loginForm.style.display = 'none'
			createForm.style.display = 'block'
			loginSelect.classList.add('form-selector-inactive')
			loginSelect.classList.remove('form-selector-active')
			createSelect.classList.remove('form-selector-inactive')
			createSelect.classList.add('form-selector-active')
		}
	}

	// animate logo spin
	const spinLogo = async () => {
		dockLogo.style.transform = 'rotate(360deg)'
	}

	// animate logo unspin
	const unSpinLogo = async () => {
		dockLogo.style.transform = 'rotate(0)'
	}

	// animate logo on hover
	dockLogo.addEventListener('mouseenter', spinLogo)
	dockLogo.addEventListener('mouseleave', unSpinLogo)

	// handle form select
	const selectForm = async (event) => {
		loginStatus = event.srcElement.id.replace(/^select-/, '')
		await updateForm()
	}
	loginSelect.addEventListener('click', selectForm)
	createSelect.addEventListener('click', selectForm)
	await updateForm()

	await spinLogo()
	setTimeout(async () => {
		await unSpinLogo()
	}, 1000)
}

window.onload = init
