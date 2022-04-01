const init = async () => {
	let loginStatus = 'login'

	const loginForm = document.querySelector('#login')
	const createForm = document.querySelector('#create')
	const loginSelect = document.querySelector('#select-login')
	const createSelect = document.querySelector('#select-create')
	const errorText = document.querySelector('#error-text')

	// handle login form submit
	loginForm.addEventListener('submit', async (event) => {
		event.preventDefault()
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
			errorText.innerText = json.message
			errorText.style.display = 'block'
		}
	})

	// handle new account form submit
	createForm.addEventListener('submit', async (event) => {
		event.preventDefault()
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
			errorText.innerText = json.message
			errorText.style.display = 'block'
		}
	})

	// update form based on selector
	const updateForm = async (status) => {
		errorText.style.display = 'none'
		if (loginStatus === 'login') {
			createForm.style.display = 'none'
			createSelect.style.textDecoration = 'underline'
			createSelect.style.color = 'blue'
			loginForm.style.display = 'block'
			loginSelect.style.textDecoration = 'none'
			loginSelect.style.color = 'black'
		} else {
			loginForm.style.display = 'none'
			loginSelect.style.textDecoration = 'underline'
			loginSelect.style.color = 'blue'
			createForm.style.display = 'block'
			createSelect.style.textDecoration = 'none'
			createSelect.style.color = 'black'
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
