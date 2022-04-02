const init = async () => {
	let loginStatus = 'login'

	const loginForm = document.querySelector('#login')
	const createForm = document.querySelector('#create')
	const loginSelect = document.querySelector('#select-login')
	const createSelect = document.querySelector('#select-create')
	const errorText = document.querySelector('#error-text')
	const submitButton = document.querySelector('#submit-button')

	submitButton.addEventListener('click', async (event) => {
		if (loginStatus === 'login') {
			await submitLoginForm()
		} else {
			await submitCreateForm()
		}
	})

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

	// handle form select
	const selectForm = async (event) => {
		loginStatus = event.srcElement.id.replace(/^select-/, '')
		await updateForm()
	}
	loginSelect.addEventListener('click', selectForm)
	createSelect.addEventListener('click', selectForm)
	await updateForm()
}

window.onload = init
