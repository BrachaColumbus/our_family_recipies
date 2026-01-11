// הנתונים האישיים שלך
const OWNER = 'BrachaColumbus'; 
const REPO = 'our_family_recipies';
const FILE_PATH = 'recipes.json';

let currentUser = "";
let allMyRecipes = [];
let editingIndex = null;
let hasLiked = false; 
let currentImageData = ""; // משתנה גלובלי לאחסון התמונה

// פונקציית התחברות
let TOKEN = ""; 
const part1 = "ghp_MQt8otTpwcEFn8pI"; 
const part2 = "JIINq2p74o8Ypi3jOOzM"; 

function login() {
    currentUser = document.getElementById('username').value.trim();
    let userPass = prompt("הזינו סיסמה משפחתית:");
    if (!userPass) return;
    userPass = userPass.trim().replace(/\s+/g, ' ');

    if (currentUser && (userPass === "משפחת קולומבוס המקסימה" || userPass === "מרים גליק")) {
        TOKEN = part1 + part2; 
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('recipe-list-screen').style.display = 'block';
        document.getElementById('display-user').innerText = currentUser;
        loadRecipes();
        alert("ברוכים הבאים למטבח! ✨");
    } else {
        alert("הסיסמה לא תואמת. נסו שוב.");
    }
}

// פונקציה לטיפול בקובץ התמונה - גלובלית
function handleFile(file) {
    const preview = document.getElementById('image-preview');
    const dropText = document.getElementById('drop-text');

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImageData = e.target.result; // שמירת מחרוזת התמונה
            preview.src = currentImageData;
            preview.style.display = 'block';
            dropText.innerText = "תמונה נבחרה בהצלחה! ✨";
        };
        reader.readAsDataURL(file);
    }
}

// הגדרת אירועי גרירה ברגע שהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (!dropZone) return;

    // לחיצה על האזור פותחת בחירה
    dropZone.onclick = () => fileInput.click();

    // מניעת ברירת המחדל של הדפדפן (חשוב מאוד!)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    dropZone.addEventListener('dragover', () => { dropZone.style.background = "#fcf8e8"; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.background = "rgba(212, 175, 55, 0.05)"; });

    dropZone.addEventListener('drop', (e) => {
        dropZone.style.background = "rgba(212, 175, 55, 0.05)";
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });
});

async function loadRecipes() {
    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        if (!response.ok) return;
        const fileData = await response.json();
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        const content = JSON.parse(decodedContent);
        
        allMyRecipes = content.filter(r => r.user === currentUser);
        renderRecipes(allMyRecipes);
    } catch (e) { console.error("שגיאה בטעינה:", e); }
}

function renderRecipes(recipesToDisplay) {
    const list = document.getElementById('recipes-list');
    list.innerHTML = '';
    recipesToDisplay.forEach((recipe, index) => {
        list.innerHTML += `
            <div class="recipe-card slide-in" onclick="openFullRecipe(${index})">
                <div class="recipe-header">
                    <h3>${recipe.title} <span class="emoji">🥘</span></h3>
                    <span class="arrow">⬅</span>
                </div>
            </div>`;
    });
}

function openFullRecipe(index) {
    const recipe = allMyRecipes[index];
    document.getElementById('recipe-list-screen').style.display = 'none';
    document.getElementById('single-recipe-screen').style.display = 'block'; 

    const content = document.getElementById('full-recipe-content');
    content.innerHTML = `
        <h1 class="elegant-title">${recipe.title}</h1>
        ${recipe.img ? `<img src="${recipe.img}" style="width:100%; border-radius:15px; margin-bottom:20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">` : ''}
        <div class="section-box">
            <h3>🌿 המצרכים</h3>
            <p>${recipe.ing}</p>
        </div>
        <div class="section-box">
            <h3>👩‍🍳 אופן ההכנה</h3>
            <p>${recipe.inst}</p>
        </div>
    `;

    document.getElementById('edit-btn-placeholder').onclick = () => editRecipe(index);
    document.getElementById('delete-btn-placeholder').onclick = () => deleteRecipe(index);
    window.scrollTo(0, 0);
}

async function saveRecipe() {
    const title = document.getElementById('recipe-title').value;
    const ing = document.getElementById('recipe-ingredients').value;
    const inst = document.getElementById('recipe-instructions').value;

    if (!title || !ing || !inst) { alert("נא למלא את כל השדות ✨"); return; }

    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const fileData = await response.json();
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        let content = JSON.parse(decodedContent);

        const newRecipe = { title, ing, inst, user: currentUser, img: currentImageData };

        if (editingIndex !== null) {
            const oldRecipe = allMyRecipes[editingIndex];
            const idxInFull = content.findIndex(r => r.title === oldRecipe.title && r.user === currentUser);
            if (idxInFull !== -1) content[idxInFull] = newRecipe;
        } else {
            content.push(newRecipe);
        }

        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content))));
        await updateGitHub(encoded, fileData.sha, "עדכון מתכון");
        alert("נשמר בהצלחה! 👑");
        showListScreen();
    } catch (e) { alert("שגיאה בשמירה"); }
}

function editRecipe(index) {
    const recipe = allMyRecipes[index];
    editingIndex = index;
    document.getElementById('recipe-title').value = recipe.title;
    document.getElementById('recipe-ingredients').value = recipe.ing;
    document.getElementById('recipe-instructions').value = recipe.inst;
    
    if(recipe.img) {
        currentImageData = recipe.img;
        document.getElementById('image-preview').src = recipe.img;
        document.getElementById('image-preview').style.display = 'block';
        document.getElementById('drop-text').innerText = "תמונה קיימת ✨";
    }

    showAddRecipeScreen();
}

function clearForm() {
    document.getElementById('recipe-title').value = '';
    document.getElementById('recipe-ingredients').value = '';
    document.getElementById('recipe-instructions').value = '';
    currentImageData = "";
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('drop-text').innerText = "גררו תמונה לכאן או לחצו לבחירה";
}

async function updateGitHub(contentEncoded, sha, message) {
    return fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: contentEncoded, sha })
    });
}

// פונקציות ניווט וסינון
function showListScreen() {
    document.getElementById('add-recipe-screen').style.display = 'none';
    document.getElementById('single-recipe-screen').style.display = 'none';
    document.getElementById('recipe-list-screen').style.display = 'block';
    editingIndex = null;
    loadRecipes();
}

function showAddRecipeScreen() {
    document.getElementById('recipe-list-screen').style.display = 'none';
    document.getElementById('single-recipe-screen').style.display = 'none';
    document.getElementById('add-recipe-screen').style.display = 'block';
    if (editingIndex === null) clearForm();
}

function filterRecipes() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtered = allMyRecipes.filter(r => r.title.toLowerCase().includes(searchTerm));
    renderRecipes(filtered);
}

// מוזיקה וקול
var myMagicPlayer = null; 
async function toggleMusic(event) {
    if (event) event.stopPropagation();
    const audioUrl = "song.mp3"; 
    if (!myMagicPlayer) { myMagicPlayer = new Audio(audioUrl); myMagicPlayer.loop = true; }
    if (myMagicPlayer.paused) { myMagicPlayer.play(); event.currentTarget.innerHTML = "🎶"; }
    else { myMagicPlayer.pause(); event.currentTarget.innerHTML = "🎵"; }
}

function readRecipe() {
    const title = document.querySelector('#full-recipe-content h1').innerText;
    const content = document.querySelector('#full-recipe-content').innerText;
    const utterance = new SpeechSynthesisUtterance(title + ". " + content);
    utterance.lang = 'he-IL';
    window.speechSynthesis.speak(utterance);
}

function handleVote(type) {
    const likeSpan = document.getElementById('like-count');
    let count = parseInt(likeSpan.innerText);
    likeSpan.innerText = type === 'up' ? count + 1 : count - 1;
}
