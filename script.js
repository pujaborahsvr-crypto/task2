// Simple To-Do app using localStorage
// Features: add/edit/delete, complete/uncomplete, filter, search, clear completed, drag reorder

const selectors = {
  form: document.getElementById('task-form'),
  input: document.getElementById('task-input'),
  list: document.getElementById('task-list'),
  count: document.getElementById('task-count'),
  filters: {
    all: document.getElementById('filter-all'),
    active: document.getElementById('filter-active'),
    completed: document.getElementById('filter-completed')
  },
  search: document.getElementById('search'),
  clearCompleted: document.getElementById('clear-completed')
};

let tasks = [];
let filter = 'all';
let dragIndex = null;

function save(){
  localStorage.setItem('todo_tasks_v1', JSON.stringify(tasks));
  render();
}

function load(){
  try{
    const raw = localStorage.getItem('todo_tasks_v1');
    tasks = raw ? JSON.parse(raw) : [];
  }catch(e){
    tasks = [];
  }
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function addTask(text){
  tasks.unshift({id: uid(), text: text.trim(), done:false, created: Date.now()});
  save();
}

function toggleDone(id){
  const t = tasks.find(x=>x.id===id);
  if(t) t.done = !t.done;
  save();
}

function deleteTask(id){
  tasks = tasks.filter(x=>x.id!==id);
  save();
}

function clearCompleted(){
  tasks = tasks.filter(x=>!x.done);
  save();
}

function editTask(id, newText){
  const t = tasks.find(x=>x.id===id);
  if(t){ t.text = newText.trim(); save(); }
}

// Filtering + searching
function getVisibleTasks(){
  const q = selectors.search.value.trim().toLowerCase();
  return tasks.filter(t=>{
    if(filter==='active' && t.done) return false;
    if(filter==='completed' && !t.done) return false;
    if(q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });
}

// Rendering
function render(){
  selectors.list.innerHTML = '';
  const visible = getVisibleTasks();
  visible.forEach((t, idx)=>{
    const li = document.createElement('li');
    li.className = 'task-item';
    li.draggable = true;
    li.dataset.id = t.id;

    // checkbox
    const cb = document.createElement('button');
    cb.className = 'checkbox' + (t.done ? ' checked' : '');
    cb.title = t.done ? 'Mark as not done' : 'Mark as done';
    cb.innerHTML = t.done ? '✓' : '';
    cb.onclick = ()=> toggleDone(t.id);

    // text
    const span = document.createElement('div');
    span.className = 'task-text' + (t.done ? ' completed' : '');
    span.textContent = t.text;
    span.contentEditable = false;
    span.spellcheck = false;
    span.ondblclick = ()=> startEdit(span, t.id);

    // actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.title = 'Edit';
    editBtn.innerHTML = '✎';
    editBtn.onclick = ()=> startEdit(span, t.id);

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn';
    delBtn.title = 'Delete';
    delBtn.innerHTML = '🗑';
    delBtn.onclick = ()=> {
      if(confirm('Delete this task?')) deleteTask(t.id);
    };

    actions.append(editBtn, delBtn);

    li.append(cb, span, actions);
    selectors.list.appendChild(li);

    // Drag events
    li.addEventListener('dragstart', e=>{
      dragIndex = tasks.findIndex(x=>x.id===t.id);
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', ()=> li.classList.remove('dragging'));
    li.addEventListener('dragover', e=>{
      e.preventDefault();
      const overId = li.dataset.id;
      const overIndex = tasks.findIndex(x=>x.id===overId);
      if(dragIndex===null || overIndex===-1 || dragIndex===overIndex) return;
      // reorder in tasks array
      const item = tasks.splice(dragIndex,1)[0];
      tasks.splice(overIndex,0,item);
      dragIndex = overIndex;
      save(); // saves and re-renders
    });
  });

  selectors.count.textContent = tasks.length + ' task' + (tasks.length===1 ? '' : 's');
  // update active filter UI
  Object.values(selectors.filters).forEach(btn=> btn.classList.remove('active'));
  if(filter==='all') selectors.filters.all.classList.add('active');
  if(filter==='active') selectors.filters.active.classList.add('active');
  if(filter==='completed') selectors.filters.completed.classList.add('active');
}

// Editing helper
function startEdit(span, id){
  const original = span.textContent;
  span.contentEditable = true;
  span.focus();
  document.execCommand('selectAll', false, null);

  function finish(){
    span.contentEditable = false;
    const value = span.textContent.trim();
    if(!value) { span.textContent = original; return; }
    if(value !== original) editTask(id, value);
  }

  span.addEventListener('blur', finish, {once:true});
  span.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); span.blur(); }
    if(e.key === 'Escape'){ span.textContent = original; span.blur(); }
  });
}

// Events
selectors.form.addEventListener('submit', e=>{
  e.preventDefault();
  const v = selectors.input.value;
  if(!v.trim()) return;
  addTask(v);
  selectors.input.value = '';
});

selectors.filters.all.addEventListener('click', ()=> { filter='all'; render(); });
selectors.filters.active.addEventListener('click', ()=> { filter='active'; render(); });
selectors.filters.completed.addEventListener('click', ()=> { filter='completed'; render(); });

selectors.search.addEventListener('input', ()=> render());
selectors.clearCompleted.addEventListener('click', ()=> {
  if(confirm('Remove all completed tasks?')) clearCompleted();
});

// initialize
load();
render();


// 🌙 Theme toggle
const themeBtn = document.getElementById('theme-toggle');

// load theme
if(localStorage.getItem('todo_theme') === 'dark'){
  document.body.classList.add('dark');
  themeBtn.textContent = "☀ Light Mode";
}

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeBtn.textContent = isDark ? "☀ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem('todo_theme', isDark ? 'dark' : 'light');
});
