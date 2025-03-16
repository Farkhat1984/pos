/**
 * UI Controller for common UI operations
 */
const UIController = (() => {
    /**
     * Show a modal dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Array} buttons - Array of button configs {text, handler, primary}
     */
    function showDialog(title, message, buttons = []) {
        // Create dialog element
        const dialog = document.createElement('div');
        dialog.className = 'dialog';

        const dialogContent = document.createElement('div');
        dialogContent.className = 'dialog-content';

        // Add title
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        dialogContent.appendChild(titleElement);

        // Add message
        if (message) {
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            dialogContent.appendChild(messageElement);
        }

        // Add buttons
        if (buttons.length > 0) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'dialog-actions';

            buttons.forEach(button => {
                const buttonElement = document.createElement('button');
                buttonElement.textContent = button.text;
                buttonElement.className = button.primary ? 'btn btn-primary' : 'btn';

                if (button.danger) {
                    buttonElement.classList.add('btn-danger');
                }

                buttonElement.addEventListener('click', () => {
                    // Close dialog
                    document.body.removeChild(dialog);

                    // Call handler if provided
                    if (typeof button.handler === 'function') {
                        button.handler();
                    }
                });

                buttonsContainer.appendChild(buttonElement);
            });

            dialogContent.appendChild(buttonsContainer);
        }

        dialog.appendChild(dialogContent);
        document.body.appendChild(dialog);

        return dialog;
    }

    /**
     * Show a confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Function} onConfirm - Function to call when confirmed
     * @param {Function} onCancel - Function to call when cancelled
     */
    function showConfirmDialog(title, message, onConfirm, onCancel) {
        return showDialog(title, message, [
            {
                text: 'ОТМЕНА',
                handler: onCancel
            },
            {
                text: 'ПОДТВЕРДИТЬ',
                primary: true,
                handler: onConfirm
            }
        ]);
    }

    /**
     * Show a delete confirmation dialog
     * @param {string} itemName - Name of the item to delete
     * @param {Function} onConfirm - Function to call when confirmed
     */
    function showDeleteConfirmDialog(itemName, onConfirm) {
        return showDialog(
            'Подтверждение удаления',
            `Вы уверены, что хотите удалить "${itemName}"? Это действие нельзя отменить.`,
            [
                {
                    text: 'ОТМЕНА',
                    handler: () => { }
                },
                {
                    text: 'УДАЛИТЬ',
                    primary: true,
                    danger: true,
                    handler: onConfirm
                }
            ]
        );
    }

    /**
     * Show a snackbar message
     * @param {string} message - Message to show
     * @param {number} duration - Duration in milliseconds
     */
    function showSnackbar(message, duration = 3000) {
        // Check if we already have a snackbar
        let snackbar = document.getElementById('snackbar');

        // Create if it doesn't exist
        if (!snackbar) {
            snackbar = document.createElement('div');
            snackbar.id = 'snackbar';
            document.body.appendChild(snackbar);
        }

        // Set message and show
        snackbar.textContent = message;
        snackbar.className = 'show';

        // Hide after duration
        setTimeout(() => {
            snackbar.className = snackbar.className.replace('show', '');
        }, duration);
    }

    /**
     * Show a date picker dialog
     * @param {Date} initialDate - Initial date to show
     * @param {Function} onSelect - Function to call with selected date
     */
    function showDatePicker(initialDate, onSelect) {
        // Create a simple date picker dialog
        // Real implementation would use a library like flatpickr

        const date = initialDate || new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        const dialog = document.createElement('div');
        dialog.className = 'dialog';

        const content = document.createElement('div');
        content.className = 'dialog-content';

        const title = document.createElement('h3');
        title.textContent = 'Выберите дату';
        content.appendChild(title);

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = formattedDate;
        dateInput.style.width = '100%';
        dateInput.style.marginTop = '20px';
        dateInput.style.marginBottom = '20px';
        content.appendChild(dateInput);

        const actions = document.createElement('div');
        actions.className = 'dialog-actions';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn';
        cancelButton.textContent = 'ОТМЕНА';
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
        };
        actions.appendChild(cancelButton);

        const okButton = document.createElement('button');
        okButton.className = 'btn btn-primary';
        okButton.textContent = 'OK';
        okButton.onclick = () => {
            const selectedDate = new Date(dateInput.value);
            if (typeof onSelect === 'function') {
                onSelect(selectedDate);
            }
            document.body.removeChild(dialog);
        };
        actions.appendChild(okButton);

        content.appendChild(actions);
        dialog.appendChild(content);
        document.body.appendChild(dialog);
    }

    /**
     * Format a date string
     * @param {string|Date} date - Date to format
     * @param {string} format - Format string ('date', 'datetime', 'time')
     * @returns {string} - Formatted date string
     */
    function formatDate(date, format = 'date') {
        if (!date) return '';

        const dateObj = typeof date === 'string' ? new Date(date) : date;

        // Format options
        const options = {
            date: { day: '2-digit', month: '2-digit', year: 'numeric' },
            datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
            time: { hour: '2-digit', minute: '2-digit' }
        };

        return dateObj.toLocaleDateString('ru-RU', options[format] || options.date);
    }

    /**
     * Format a price value
     * @param {number} price - Price to format
     * @param {string} currency - Currency symbol
     * @returns {string} - Formatted price string
     */
    function formatPrice(price, currency = '₸') {
        return `${price.toFixed(2)} ${currency}`;
    }

    // Public API
    return {
        showDialog,
        showConfirmDialog,
        showDeleteConfirmDialog,
        showSnackbar,
        showDatePicker,
        formatDate,
        formatPrice
    };
})();