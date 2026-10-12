// Served by Flask: the API lives on the same origin.
class Chatbox {
    constructor(predictUrl) {
        this.predictUrl = predictUrl;
        this.args = {
            openButton: document.querySelector('.chatbox__button'),
            chatBox: document.querySelector('.chatbox__support'),
            sendButton: document.querySelector('.send__button')
        };
        this.state = false;
        this.messages = [];
    }

    display() {
        const { openButton, chatBox, sendButton } = this.args;
        openButton.addEventListener('click', () => this.toggleState(chatBox));
        sendButton.addEventListener('click', () => this.onSendButton(chatBox));
        chatBox.querySelector('input').addEventListener('keyup', ({ key }) => {
            if (key === 'Enter') this.onSendButton(chatBox);
        });
    }

    toggleState(chatbox) {
        this.state = !this.state;
        chatbox.classList.toggle('chatbox--active', this.state);
    }

    async onSendButton(chatbox) {
        const textField = chatbox.querySelector('input');
        const text = textField.value.trim();
        if (text === '') return;

        this.messages.push({ name: 'User', message: text });
        textField.value = '';
        this.updateChatText(chatbox);

        let answer;
        try {
            const response = await fetch(this.predictUrl, {
                method: 'POST',
                body: JSON.stringify({ message: text }),
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json().catch(() => ({}));
            answer = response.ok ? data.answer : (data.error || 'Sorry, something went wrong.');
        } catch (error) {
            console.error('Error:', error);
            answer = 'Sorry, I could not reach the server.';
        }
        this.messages.push({ name: 'Sam', message: answer });
        this.updateChatText(chatbox);
    }

    // Messages are inserted with textContent, never innerHTML, so user or bot text cannot inject markup.
    updateChatText(chatbox) {
        const container = chatbox.querySelector('.chatbox__messages');
        container.replaceChildren();
        this.messages.slice().reverse().forEach((item) => {
            const div = document.createElement('div');
            div.className = 'messages__item ' +
                (item.name === 'Sam' ? 'messages__item--visitor' : 'messages__item--operator');
            div.textContent = item.message;
            container.appendChild(div);
        });
    }
}

if (typeof module !== 'undefined') module.exports = { Chatbox };

if (typeof document !== 'undefined' && document.querySelector('.chatbox__support')) {
    const root = (typeof $SCRIPT_ROOT !== 'undefined' && $SCRIPT_ROOT) || '';
    new Chatbox(root + '/predict').display();
}
