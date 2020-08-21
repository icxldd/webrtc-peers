export function toast(message, time = 3000) {
	const div = document.createElement('div')
	div.style = `padding: 3vw;
        border-radius: 1vw;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        position: fixed;
        left: 50%;
        transform: translate(-50%, -50%);
        top: 50%;`
	div.innerHTML = message.message || message.msg || message
	document.body.appendChild(div)
	setTimeout(() => {
		div.remove()
	}, time)
}
