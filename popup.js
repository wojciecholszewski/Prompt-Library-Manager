const mainView = document.getElementById('main-view');
const addPromptView = document.getElementById('add-prompt-view');
const promptDetailsView = document.getElementById('prompt-details-view');
const promptList = document.getElementById('prompt-list');
const searchInput = document.getElementById('search');
let prompts = [];

function show(element) {
  element.classList.remove('hidden');
}

function hide(element) {
  element.classList.add('hidden');
}

function updatePromptList() {
  const searchValue = searchInput.value.toLowerCase();
  const filteredPrompts = prompts.filter(p => p.title.toLowerCase().includes(searchValue));

  promptList.innerHTML = '';
  filteredPrompts.forEach(prompt => {
    const promptElement = document.createElement('div');
    promptElement.classList.add('prompt-item');
    const titleElement = document.createElement('h3');
    titleElement.innerText = prompt.title;
    promptElement.appendChild(titleElement);

    const actionsElement = document.createElement('div');
    actionsElement.classList.add('prompt-item-actions');
    const copyButton = document.createElement('button');
    copyButton.innerText = 'Copy';
    copyButton.setAttribute('data-id', prompt.id);
    copyButton.classList.add('copy');
    actionsElement.appendChild(copyButton);

    const detailsButton = document.createElement('button');
    detailsButton.innerText = 'Details';
    detailsButton.setAttribute('data-id', prompt.id);
    detailsButton.classList.add('details');
    actionsElement.appendChild(detailsButton);

    promptElement.appendChild(actionsElement);
    promptList.appendChild(promptElement);
  });

  Array.from(promptList.getElementsByClassName('copy')).forEach(copyButton =>
    copyButton.addEventListener('click', function () {
      const id = parseInt(this.getAttribute('data-id'));
      const prompt = prompts.find(p => p.id === id);
      navigator.clipboard.writeText(prompt.prompt);
    })
  );

  Array.from(promptList.getElementsByClassName('details')).forEach(detailsButton =>
    detailsButton.addEventListener('click', function () {
      const id = parseInt(this.getAttribute('data-id'));
      const prompt = prompts.find(p => p.id === id);
      showPromptDetails(prompt);
    })
  );
}

function loadPrompts() {
  chrome.storage.sync.get('prompts', function (data) {
    prompts = data.prompts || [];
    updatePromptList();
  });
}

function addPrompt(title, prompt) {
  const id = Math.max(0, ...prompts.map(p => p.id)) + 1;
  prompts.push({
    id,
    title,
    prompt
  });
  savePrompts();
}

function savePrompts() {
  chrome.storage.sync.set({
    prompts
  }, function () {
    loadPrompts();
  });
}

function showPromptDetails(prompt) {
  document.getElementById('details-title').innerText = prompt.title;
  document.getElementById('details-prompt').innerText = prompt.prompt;

  document.getElementById('details-copy').onclick = function () {
    navigator.clipboard.writeText(prompt.prompt);
  };

  document.getElementById('details-delete').onclick = function () {
    prompts = prompts.filter(p => p.id !== prompt.id);
    savePrompts();
    hide(promptDetailsView);
    show(mainView);
  };

  hide(mainView);
  show(promptDetailsView);
}

document.getElementById('add').addEventListener('click', function () {
  hide(mainView);
  show(addPromptView);
});

document.getElementById('export').addEventListener('click', function () {
  const csvContent = 'Title,Prompt\n' + prompts.map(p => `"${p.title}","${p.prompt}"`).join('\n');
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'prompts.csv';
  link.click();
  URL.revokeObjectURL(url);
});

searchInput.addEventListener('input', updatePromptList);

document.getElementById('save').addEventListener('click', function () {
  const title = document.getElementById('title').value;
  const prompt = document.getElementById('prompt').value;

  if (title && prompt) {
    addPrompt(title, prompt);
    hide(addPromptView);
    show(mainView);
  }
});

document.getElementById('cancel').addEventListener('click', function () {
  hide(addPromptView);
  show(mainView);
});

document.getElementById('details-close').addEventListener('click', function () {
  hide(promptDetailsView);
  show(mainView);
});

loadPrompts();