const init = async () => {
	const tableContainer = document.querySelector('#table-container')
	const loadingText = document.querySelector('#loading-text')
	const loadedText = document.querySelector('#loaded-text')
	const errorText = document.querySelector('#error-text')
	const logoutButton = document.querySelector('#logout')
	const dockLogo = document.querySelector('#dock-logo')
	let table, thead, tbody
	let DATA = null

	// handle logout
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
			errorText.style.display = 'block'
			return
		}

		loadedText.innerHTML = 'Below is a table of configured repositories with <a href="https://github.com/wcarhart/tug" target="_blank">tug</a>. Don\'t see something you\'re expecting? Double check the <code>config.json</code> file in your dock deployment.'
		loadedText.style.display = 'block'
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
		for (let title of ['', 'Repository', 'Status', 'Version', 'Origin']) {
			let header = document.createElement('th')
			header.innerText = title
			headers.append(header)
		}
		thead.append(headers)
	}

	// redeploy a specific repository using dock server as a proxy
	async function redeploy(event) {
		this.disabled = true
		this.classList.add('redeploy-button-pending')
		setTimeout(() => {
			this.classList.remove('redeploy-button-pending')
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

	// handle copy of table data
	async function handleCopy(event) {
		this.style.transform = 'scale(0.9)'
		setTimeout(() => {
			this.style.transform = 'scale(1)'
		}, 100)

		let value
		if (this.id.startsWith('repository')) {
			let index = Number(this.id.replace(/^repository-/, ''))
			value = DATA[index].name
		} else if (this.id.startsWith('status')) {
			let index = Number(this.id.replace(/^status-/, ''))
			value = DATA[index].status
		} else if (this.id.startsWith('version')) {
			let index = Number(this.id.replace(/^version-/, ''))
			value = DATA[index].version
		} else if (this.id.startsWith('origin')) {
			let index = Number(this.id.replace(/^origin-/, ''))
			value = DATA[index].origin
		} else {
			return
		}

		let input = document.createElement('input')
		input.setAttribute('value', value)
		document.body.appendChild(input)
		input.select()
		let result = document.execCommand('copy')
		document.body.removeChild(input)
		return result
	}

	// populate table rows with data
	const populateTable = async () => {
		for (let [index, tug] of DATA.entries()) {
			let buttonTd = document.createElement('td')
			let button = document.createElement('button')
			button.innerText = '↻'
			button.id = `redeploy-${index}`
			button.className = 'redeploy-button'
			button.addEventListener('click', redeploy)
			buttonTd.append(button)

			let row = document.createElement('tr')
			let repository = document.createElement('td')
			let status = document.createElement('td')
			let version = document.createElement('td')
			let origin = document.createElement('td')
			repository.innerText = tug.name
			repository.className = 'repository-td'
			repository.id = `repository-${index}`
			repository.addEventListener('click', handleCopy)
			status.innerText = tug.status
			status.className = 'status-td'
			status.id = `status-${index}`
			status.addEventListener('click', handleCopy)
			version.innerText = tug.version
			version.className = 'version-td'
			version.id = `version-${index}`
			version.addEventListener('click', handleCopy)
			origin.innerText = tug.origin
			origin.id = `origin-${index}`
			origin.className = 'origin-td'
			origin.addEventListener('mousedown', handleCopy)

			for (let td of [buttonTd, repository, status, version, origin]) {
				row.append(td)
			}

			tbody.append(row)
		}
	}

	// add built table to DOM
	const showTable = async () => {
		tableContainer.append(table)
		tableContainer.style.display = 'block'
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

	// attempt to populate the table
	await populateData()

	// if population fails, don't render page
	if (DATA !== null) {
		let interval = setInterval(populateData, 3000)
		await createTable()
		await populateTable()
		await showTable()
		await spinLogo()
		setTimeout(async () => {
			await unSpinLogo()
		}, 1000)
	}
}
window.onload = init
