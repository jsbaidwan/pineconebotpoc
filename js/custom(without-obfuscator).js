$(document).ready(function() {
		// Trigger button click on Enter key press
	$('#user-input').keypress(function(e) {
		if (e.which === 13 && !e.shiftKey) { // Check if Enter key is pressed (without Shift)
			$('#submit-btn').click();
			e.preventDefault(); // Prevent the default action of Enter (new line in textarea)
		}
	});
	
	$('#submit-btn').click(function() {
		const userInput = $('#user-input').val().trim();
		if (userInput !== "") {
			appendUserMessage(userInput);
			$('#user-input').val(""); // Clear input field after submission
			fetchResponse(userInput);
		} else {
			alert("Please enter a message.");
		}
	});
	function appendUserMessage(message) {
		$('#chat').append('<div style="margin-bottom: 5px;margin-top: 10px;"><strong>You:</strong> ' + message + '</div>');
		scrollToBottom();
	}
	function appendBotMessage(message) {
		$('#chat').append(message);
		scrollToBottom();
	}
	function fetchResponse(userInput) {
		const btn = $('#submit-btn');
		btn.attr('disabled', true);
		btn.css('background-color', '#acb2b9');
		const apiKey = "pcsk_43jgna_Prkbgab77NYa1jUes8uEao4WGyGKMYtRgjRZaxxPGsmMK3f9wn6UdQ1cbvADwMn";
		const url = "https://prod-1-data.ke.pinecone.io/assistant/chat/agent/chat/completions";
		const messagesArr = [
		{ role: 'user', content: 'Hi' },
		{ role: 'assistant', content: 'How can I help you?' },
		{ role: 'user', content: userInput }
		];
		appendBotMessage('<div style="margin-bottom: 5px;margin-top: 10px;"><strong>Bot:</strong>');
		fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Api-Key': apiKey,
			},
			body: JSON.stringify({ "stream": true, messages: messagesArr, "model": "gpt-4o" })
		})
		.then(response => {
		btn.attr('disabled', false);
		btn.css('background-color', '#007bff');
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let formattedMessages = [];
		let currentMessage = '';
		function read() {
			return reader.read().then(({ done, value }) => {
				if (done) {
					return formattedMessages;
				}
				const val = decoder.decode(value, { stream: true });
				const regex = /"content"\s*:\s*"([^"]*)"/g;
				let match;
				while ((match = regex.exec(val)) !== null) {
					const mVal = match[1];
					const formattedMessage = mVal.replace(/\\n/g, '<br>'); // Replace newlines with <br>
					currentMessage += formattedMessage;
					appendBotMessage(formattedMessage); // Append message to the chat in real-time
					formattedMessages.push(formattedMessage);
				}
				return read();
			});
		}
		read().then(rsp => {
			rsp = rsp.toString();
			const spacedStr = rsp.replace(/(<br>|<br><br>)/g, ' $1 ');
			const rsp11 = spacedStr.replace(/,/g, '');
			//Check whether the response contains code and wrap it in <pre>.
			const codeRegex = /`(.*?)`/g;
			if (rsp11.match(codeRegex)) {
				const code = rsp11.replace(codeRegex, '<pre>$1</pre>');
				const lastDiv = $('#chat div:last'); // Ensure lastDiv is defined here.
				lastDiv.after('<div>' + code + '</div>');
				//addCopyButton(lastDiv.next());
			} else {
				const rsp2 = rsp11.replace(/(https?:\/\/[^\s<>"]+(?=\s|$))/g, '<a href="$1" target="_blank">$1</a>');
				const lastDiv = $('#chat div:last'); // Make sure lastDiv is properly defined here.
				lastDiv.after('<div>' + rsp2 + '</div>');
			}
			const last = $('#chat div:last');
				$('#chat').contents().filter(function() {
				return this.nodeType === 3 && $.trim(this.nodeValue) !== '';
			}).remove();
			last.nextAll('br').remove();
		})
		.catch(error => console.error('Error:', error));
		});
	}
	function scrollToBottom() {
		$('#chat').scrollTop($('#chat')[0].scrollHeight);
	}
	// Add Copy button next to the code block
	function addCopyButton(codeDiv) {
		const copyButton = $('<button class="copy-btn">Copy</button>');
		codeDiv.append(copyButton);
		copyButton.click(function() {
		const codeText = codeDiv.find('pre').text();
			navigator.clipboard.writeText(codeText).then(() => {
				alert('Code copied to clipboard!');
			}).catch(err => {
			alert('Failed to copy text: ' + err);
			});
		});
	}
});