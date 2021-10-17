import { delegateEvent, listen, query } from './helpers.js';

const _itemId = element => parseInt(element.parentNode.dataset.id || element.parentNode.parentNode.dataset.id, 10);

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

export default class View {

  constructor(template) {
    this.template = template;
    this.$todoList = query('.todo-list');
    this.$todoItemCounter = query('.todo-count');
    this.$clearCompleted = query('.clear-completed');
    this.$main = query('.main');
    this.$toggleAll = query('.toggle-all');
    this.$newTodo = query('.new-todo');

    delegateEvent(this.$todoList, 'li label', 'dblclick', ({ target }) => {
      this.editItem(target);
    });
  }

  editItem(target) {
    const listItem = target.parentElement.parentElement;

    listItem.classList.add('editing');

    const input = document.createElement('input');
    input.className = 'edit';

    input.value = target.innerText;
    listItem.appendChild(input);
    input.focus();
  }

  showItems(items) {
    //this.$todoList.innerHTML = this.template.itemList(items);
    this.getDataFromServer()
  }


  getDataFromServer(){
    let todos = JSON.parse(localStorage['todos-vanilla-es6'] || '[]')
    let tempThis = this;
		fetch('https://jsonplaceholder.typicode.com/todos')
		.then(response => response.body)
		.then(rb => {
		  const reader = rb.getReader();
		
		  return new ReadableStream({
			start(controller) {
			  // The following function handles each data chunk
			  function push() {
				// "done" is a Boolean and value a "Uint8Array"
				reader.read().then( ({done, value}) => {
				  // If there is no more data to read
				  if (done) {
					controller.close();
					return;
				  }
				  controller.enqueue(value);
				  push();
				})
			  }
			  push();
			}
		  });
		})
		.then(stream => {
		  return new Response(stream, { headers: { "Content-Type": "application/json", "Accept": "application/json" } }).text();
		})
		.then(result => {
           let jsonResult = JSON.parse(result) 
          //  jsonResult.push(todos)
          //  console.log(typeof jsonResult, "jsonResult")
          //  console.log(typeof items, "items")

          // items.push(jsonResult);
           //console.log(jsonResult)
      tempThis.$todoList.innerHTML = this.template.itemList(jsonResult);
		});


	}


  removeItem(id) {
    const elem = query(`[data-id="${id}"]`);

    if (elem) {
      this.$todoList.removeChild(elem);
    }
  }

  setItemsLeft(itemsLeft) {
    this.$todoItemCounter.innerHTML = this.template.itemCounter(itemsLeft);
  }

  setClearCompletedButtonVisibility(visible) {
    this.$clearCompleted.style.display = !!visible ? 'block' : 'none';
  }

  setMainVisibility(visible) {
    this.$main.style.display = !!visible ? 'block' : 'none';
  }

  setCompleteAllCheckbox(checked) {
    this.$toggleAll.checked = !!checked;
  }

  updateFilterButtons(route) {
    query('.filters .selected').className = '';
    query(`.filters [href="#/${route}"]`).className = 'selected';
  }

  clearNewTodo() {
    this.$newTodo.value = '';
  }

  setItemComplete(id, completed) {
    const listItem = query(`[data-id="${id}"]`);

    if (!listItem) {
      return;
    }

    listItem.className = completed ? 'completed' : '';
    query('input', listItem).checked = completed;
  }

  editItemDone(id, title) {
    const listItem = query(`[data-id="${id}"]`);

    const input = query('input.edit', listItem);

    listItem.removeChild(input);
    listItem.classList.remove('editing');

    query('label', listItem).textContent = title;
  }

  bindAddItem(handler) {
    listen(this.$newTodo, 'change', ({ target }) => {
      const title = target.value.trim();
      if (title) {
        handler(title);
      }
    });
  }

  bindRemoveCompleted(handler) {
    listen(this.$clearCompleted, 'click', handler);
  }

  bindToggleAll(handler) {
    listen(this.$toggleAll, 'click', ({ target }) => {
      handler(target.checked);
    });
  }

  bindRemoveItem(handler) {
    delegateEvent(this.$todoList, '.destroy', 'click', ({ target }) => {
      handler(_itemId(target));
    });
  }

  bindToggleItem(handler) {
    delegateEvent(this.$todoList, '.toggle', 'click', ({ target }) => {
      handler(_itemId(target), target.checked);
    });
  }

  bindEditItemSave(handler) {
    delegateEvent(this.$todoList, 'li .edit', 'blur', ({ target }) => {
      if (!target.dataset.iscanceled) {
        handler(_itemId(target), target.value.trim());
      }
    }, true);

    delegateEvent(this.$todoList, 'li .edit', 'keypress', ({ target, keyCode }) => {
    });
  }

  bindEditItemCancel(handler) {
    delegateEvent(this.$todoList, 'li .edit', 'keyup', ({ target, keyCode }) => {
      if (keyCode === ESCAPE_KEY || keyCode === 13) {
        target.dataset.iscanceled = true;
        target.blur();

        handler(_itemId(target));
      }
    });
  }
}
