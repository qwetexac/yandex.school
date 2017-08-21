'use strict';

const defaultInputs = ['fio', 'email', 'phone'];
const res = {
	success: {
		status: 'success'
	},
	error: {
		status: 'error',
		reason: 'Не удалось отправить данные. Попробуйте еще раз'
	},
	progress: {
		status: 'progress',
		timeout: 1000
	}
}

const elems = {
	$resultContainer     : document.getElementById('resultContainer'),
	$resultTextContainer : document.getElementById('resultsText'),
	$button              : document.getElementById('submitButton')
}

const fetchImitation = (url) => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(res[url]);
		}, 500);
	})
}

EventTarget.prototype.addEventListener = (() => {
	const addEventListener = EventTarget.prototype.addEventListener;
	return function () {
		addEventListener.apply(this, arguments);
		return this;
	};
})();

class PhoneFormatter {
	static get formats() {
		return [
			{
				range: [0,1],
				char: '+'
			},
			{
				range: [1,4],
				char: '('
			},
			{
				range: [4,7],
				char: ')'
			},
			{
				range: [7,9],
				char: '-'
			},
			{
				range: [9,11],
				char: '-'
			}
		]
	}
	
	static outputView(phone) {
		
		phone = PhoneFormatter.clearFromChars(phone);
		
		return PhoneFormatter.formats
			.map(format => phone.slice(format.range[0], format.range[1]))
			.map((group, i) => group.length ? `${PhoneFormatter.formats[i].char}${group}` : group)
			.join('');
	}
	
	static clearFromChars(phone) {
		return phone.replace(/\D/g, '').slice(0,11);
	}
	
	static validate(phone) {
		return /^(\+7\(\d{3}\)\d{3}-\d{2}-\d{2})/.test(phone) &&
			PhoneFormatter.clearFromChars(phone).split('').reduce((prev, curr) => parseInt(prev) + parseInt(curr)) <= 30;
	}
}

class Form {
	constructor() {
		this.$el = document.getElementById('myForm');
		this._data = defaultInputs.reduce((acc, cur) => {
			acc[cur] = '';
			return acc;
		}, {});
	}
	
	validate() {
		let inputs = [];
		Object.keys(this._data).map(name => {
			let result = { case: name };
			switch (name) {
				case 'fio': {
					result.isValid = this._data.fio.trim().replace(/\s/g, ' ').split(' ').length === 3 && !/\d/g.test(this._data.fio);
					break;
				}
				
				case 'phone': {
					result.isValid = PhoneFormatter.validate(this._data.phone);
					break;
				}
				
				case 'email': {
					result.isValid = /.+@(ya.ru|yandex.ru|yandex.ua|yandex.by|yandex.kz|yandex.com)/g.test(this._data.email);
					break;
				}
				
				default: {
					result.isValid = true;
					break;
				}
			}
			
			inputs.push(result);
		});
		
		return {
			isValid: inputs.every(input => input.isValid),
			errorFields: inputs
				.filter(input => !input.isValid)
				.map(input => input.case)
		}
	}
	
	getData() {
		return this._data;
	}
	
	setData(newData) {
		this._data = defaultInputs.reduce((acc, cur) => {
			acc[cur] = newData[cur] ? newData[cur] : this._data[cur];
			return acc;
		}, {});
		
		if (newData.phone) {
			this._data.phone = PhoneFormatter.outputView(newData.phone);
		}
		
		Object.keys(this._data).map((name) => {
			let value = this._data[name];
			
			if (name === 'phone') {
				value = PhoneFormatter.outputView(this._data.phone);
			}
			
			document.getElementsByName(name)[0].value = value;
		});
	}
	
	submit() {
		let result = this.validate();
		
		defaultInputs.map((field) => {
			let input = document.getElementsByName(field)[0];
			if (result.errorFields.includes(field)) {
				input.classList.add('error');
			} else {
				input.classList.remove('error');
			}
		});
		
		if (result.isValid) {
			elems.$button.setAttribute('disabled', true);
			
			const sendRequest = () => {
				fetchImitation(myForm.$el.getAttribute('action')).then(res => {
					
					switch(res.status) {
						case 'success':
						case 'error': {
							elems.$button.removeAttribute('disabled');
							elems.$resultContainer.className = res.status;
							elems.$resultTextContainer.innerHTML = res.status === 'success' ? 'Success!' : res.reason;
							break;
						}
						
						case 'progress': {
							elems.$resultTextContainer.innerHTML += `<hr>Не получилось...`;
							elems.$resultContainer.className = res.status;
							elems.$resultTextContainer.innerHTML += `<br>Повторная отправка произойдет через ${res.timeout}мс...`
							setTimeout(() => {
								elems.$resultTextContainer.innerHTML += `<br>Отправляю еще раз...`;
								sendRequest();
							}, res.timeout);
							break;
						}
					}
				})
			}
			
			sendRequest();
		}
	}
}

window.myForm = new Form();

myForm.$el
	.addEventListener('keydown', (e) => {
		let input = e.target;
		myForm.setData({
			[input.getAttribute('name')] : input.value
		})
	})
	.addEventListener('submit', (e) => {
		e.preventDefault();
		myForm.submit();
	});
