// הנתונים האישיים שלך
const OWNER = 'BrachaColumbus'; 
const REPO = 'our_family_recipies';
const FILE_PATH = 'recipes.json';

let currentUser = "";
let allMyRecipes = [];
let editingIndex = null;
let hasLiked = false; 
let currentImageData = ""; // משתנה לתמונה

// פונקציית התחברות
let TOKEN = ""; 
const part1 = "ghp_MQt8otTpwcEFn8pI"; 
const part2 = "JIINq2p74o8Ypi3jOOzM"; 

function login() {
    currentUser = document.getElementById('username').value.trim();
    let userPass = prompt("הזינו סיסמה משפחתית:");
    if (!userPass) return;
    userPass = userPass.trim().replace(/\s+/g, ' ');

    const pass1 = "משפחת קולומבוס המקסימה";
    const pass2 = "מרים גליק";

    if (currentUser && (userPass === pass1 || userPass === pass2)) {
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
    } catch (e) {
        console.error("שגיאה בטעינה:", e);
    }
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

    hasLiked = false;
    const likeCountSpan = document.getElementById('like-count');
    if (likeCountSpan) likeCountSpan.innerText = "0";
    
    window.scrollTo(0, 0);
}

// ניהול גרירת תמונה (מופעל כשהדף נטען)
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('image-preview');
    const dropText = document.getElementById('drop-text');

    if(!dropZone) return;

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.background = "#fcf8e8"; };
    dropZone.ondragleave = () => { dropZone.style.background = "rgba(212, 175, 55, 0.05)"; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    };

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImageData = e.target.result;
                preview.src = currentImageData;
                preview.style.display = 'block';
                dropText.innerText = "תמונה נבחרה בהצלחה! ✨";
            };
            reader.readAsDataURL(file);
        }
    }
});

async function saveRecipe() {
    const title = document.getElementById('recipe-title').value;
    const ing = document.getElementById('recipe-ingredients').value;
    const inst = document.getElementById('recipe-instructions').value;

    if (!title || !ing || !inst) {
        alert("נא למלא את כל השדות ✨");
        return;
    }

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
    } catch (e) {
        alert("שגיאה בשמירה");
    }
}

function editRecipe(index) {
    const recipe = allMyRecipes[index];
    editingIndex = index;
    document.getElementById('recipe-title').value = recipe.title;
    document.getElementById('recipe-ingredients').value = recipe.ing;
    document.getElementById('recipe-instructions').value = recipe.inst;
    
    // טעינת התמונה הקיימת לעריכה
    if(recipe.img) {
        currentImageData = recipe.img;
        document.getElementById('image-preview').src = recipe.img;
        document.getElementById('image-preview').style.display = 'block';
        document.getElementById('drop-text').innerText = "תמונה קיימת במערכת ✨";
    }

    showAddRecipeScreen();
    document.querySelector('.add-edit-title').innerText = "עריכת מתכון  ✨";
}

function clearForm() {
    document.getElementById('recipe-title').value = '';
    document.getElementById('recipe-ingredients').value = '';
    document.getElementById('recipe-instructions').value = '';
    currentImageData = "";
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('drop-text').innerText = "גררו תמונה לכאן או לחצו לבחירה";
}

// פונקציות עזר קיימות ללא שינוי (מחיקה, סינון, מוזיקה וכו')
async function deleteRecipe(index) {
    if (!confirm("למחוק את המתכון? 🗑")) return;
    const recipeToDelete = allMyRecipes[index];
    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const fileData = await response.json();
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        let content = JSON.parse(decodedContent);
        content = content.filter(r => !(r.title === recipeToDelete.title && r.user === currentUser));
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content))));
        await updateGitHub(encoded, fileData.sha, "מחיקת מתכון");
        showListScreen();
    } catch (e) { alert("שגיאה במחיקה"); }
}

async function updateGitHub(contentEncoded, sha, message) {
    return fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: contentEncoded, sha })
    });
}

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
    if (editingIndex === null) {
        document.querySelector('.add-edit-title').innerText = "הוספת מתכון חדש 📝";
        clearForm();
    }
}

function filterRecipes() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtered = allMyRecipes.filter(r => r.title.toLowerCase().includes(searchTerm));
    renderRecipes(filtered);
}

// כלי עזר (מוזיקה, לייקים וכו' - נשארים כפי שהיו)
var myMagicPlayer = null; 
async function toggleMusic(event) {
    if (event) event.stopPropagation();
    const btn = event.currentTarget;
    const audioUrl = "song.mp3"; 
    if (!myMagicPlayer) { myMagicPlayer = new Audio(audioUrl); myMagicPlayer.loop = true; }
    try {
        if (myMagicPlayer.paused) { await myMagicPlayer.play(); btn.innerHTML = "🎶"; btn.style.background = "#D4AF37"; }
        else { myMagicPlayer.pause(); btn.innerHTML = "🎵"; btn.style.background = "white"; }
    } catch (err) { alert("שגיאה בטעינת המוזיקה"); }
}

function readRecipe() {
    const btn = event.currentTarget;
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); btn.innerHTML = '🔊'; return; }
    const title = document.querySelector('#full-recipe-content h1').innerText;
    const content = document.querySelector('#full-recipe-content').innerText;
    const utterance = new SpeechSynthesisUtterance(title + ". " + content);
    utterance.lang = 'he-IL';
    btn.innerHTML = '🔇'; 
    utterance.onend = () => btn.innerHTML = '🔊';
    window.speechSynthesis.speak(utterance);
}

function handleVote(type) {
    const likeSpan = document.getElementById('like-count');
    let currentCount = parseInt(likeSpan.innerText);
    const btn = event.currentTarget;
    if (type === 'up') { currentCount++; btn.style.transform = "scale(1.3)"; } 
    else { currentCount--; btn.style.transform = "rotate(-20deg)"; }
    setTimeout(() => btn.style.transform = "scale(1) rotate(0)", 200);
    likeSpan.innerText = currentCount;
}
