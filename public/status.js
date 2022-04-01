const init = async () => {
	let table, thead, tbody
	let tableContainer = document.querySelector('#table-container')
	let loadingText = document.querySelector('#loading-text')
	let errorText = document.querySelector('#error-text')
	let logoutButton = document.querySelector('#logout')
	let DATA = null

	logoutButton.addEventListener('click', async (event) => {
		let response = await fetch('/logout', {
			method: 'POST',
			credentials: 'include'
		})
		window.location.replace('/')
	})

	// get tug statuses
	const populateData = async () => {
		let response = await fetch('/status', { credentials: 'include' })
		let json = await response.json()
		loadingText.style.display = 'none'

		if (response.status !== 200) {
			errorText.innerText = json.message
			errorText.display = 'block'
			return
		}

		DATA = json
	}

	// build table
	const createTable = async () => {
		table = document.createElement('table')
		thead = document.createElement('thead')
		tbody = document.createElement('tbody')
		table.appendChild(thead)
		table.appendChild(tbody)

		let headers = document.createElement('tr')
		for (let title of ['Repository', 'Status', 'Version', 'Origin']) {
			let header = document.createElement('th')
			header.innerText = title
			headers.append(header)
		}
		thead.append(headers)
	}

	async function redeploy(event) {
		this.disabled = true
		this.innerText = 'Redeploying...'
		setTimeout(() => {
			this.innerText = 'Redeploy'
			this.disabled = false
		}, 5000)
		let index = Number(this.id.replace(/^redeploy-/, ''))
		let tug = DATA[index]
		await fetch(`/${tug.name}`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				origin: tug.origin
			})
		})
	}

	const populateTable = async () => {
		for (let [index, tug] of DATA.entries()) {
			let row = document.createElement('tr')
			let repository = document.createElement('td')
			let status = document.createElement('td')
			let version = document.createElement('td')
			let origin = document.createElement('td')
			repository.innerText = tug.name
			status.innerText = tug.status
			version.innerText = tug.version
			origin.innerText = tug.origin

			let buttonTd = document.createElement('td')
			let button = document.createElement('button')
			button.innerText = 'Redeploy'
			button.id = `redeploy-${index}`
			button.className = 'redeploy-button'
			button.addEventListener('click', redeploy)
			buttonTd.append(button)

			for (let td of [repository, status, version, origin, buttonTd]) {
				row.append(td)
			}

			tbody.append(row)
		}
	}

	await populateData()

	if (DATA !== null) {
		let interval = setInterval(populateData, 3000)
		await createTable()
		await populateTable()
		tableContainer.append(table)
	}
}
window.onload = init
