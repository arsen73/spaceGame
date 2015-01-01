$(document).bind("keydown.left", function() { 
	pos.h = -1;
});
$(document).bind("keyup.left", function() { 
	pos.h = 0;
});

$(document).bind("keydown.right", function() { 
	pos.h = 1;
});
$(document).bind("keyup.right", function() { 
	pos.h = 0;
});

$(document).bind("keydown.up", function() { 
	pos.v = -1;
});
$(document).bind("keyup.up", function() { 
	pos.v = 0;
});

$(document).bind("keydown.down", function() {
	pos.v = 1;
});
$(document).bind("keyup.down", function() {
	pos.v = 0;
});

//зажимаем пробел чтобы стрелять
$(document).bind("keydown.space", function() {
	pos.bullet_active = true;
});
$(document).bind("keyup.space", function() {
	pos.bullet_active = false;
});

function position(){ //класс для координат
	this.h = 0;
	this.v = 0;
	this.bullet_active = false;

	this.collides = function(a, b) {
		return a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y;
	}
}

function circle(x, y, r) // класс задающий круг
{
    this.x = x; // координата х
    this.y = y; // координата у
    this.r = r; // радиус
    this.draw = function(color, globalAlpha) // метод рисующий круг
    {
        context.globalAlpha = globalAlpha; // "прозрачность"
        context.fillStyle = color; // цвет заливки
        context.beginPath();
        context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        context.fill();
    };
}

function rect(x, y, width, height) // класс задающий прямоугольник
{
    this.x = x; // координата х
    this.y = y; // координата у
    this.width = width; // ширина
    this.height = height; // высота
    this.draw = function(color, globalAlpha) // функция рисует прямоугольник согласно заданным параметрам
    {
        context.globalAlpha = globalAlpha;
        context.fillStyle = color;
        context.fillRect(this.x, this.y, this.width, this.height);
    };
}

function Game() //игровое поле и основные параметры
{
	this.width = 480; // ширина экрана
	this.height = 320; // высота экрана
	this.x = 0; // начало
    this.y = 0; // начало
    this.margin = 10;
	this.getWindowParams = function()
	{
		var w = window,
	    d = document,
	    e = d.documentElement,
	    g = d.getElementsByTagName('body')[0];
	    this.width = w.innerWidth || e.clientWidth || g.clientWidth,
	    this.height = w.innerHeight|| e.clientHeight|| g.clientHeight;
	    this.width = this.width - this.margin*2;
	    this.height = this.height - this.margin*2;
	};
	this.getWindowParams();
    this.draw = function(color, globalAlpha) // функция рисует прямоугольник согласно заданным параметрам
    {
        context.globalAlpha = globalAlpha;
        context.fillStyle = color;
        context.fillRect(this.x, this.y, this.width, this.height);
    };
    this.rand = function(min, max)
    {
  		return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

function enemy(image) // класс врагов
{ 
	this.active = true;
	this.x = game.width; // координата х
    this.y = game.height/2; // координата у
    this.width = 50;
    this.height = 50;
    this.spead = 70; //скорость
    this.p = game.rand(10,1000);
    this.draw = function() // функция вставляет картинку
    {
        context.drawImage(image, this.x, this.y);
    };
    this.update = function(fps) // движение
    {
    	if(this.x-100 > game.width)
    		this.x = 0;
    	if(this.x < 0)
    		this.x = game.width;
    	this.x = this.x-this.spead*(1/fps); 
    	this.y = 0.9*(game.height/2)*Math.sin((this.x+this.p)/100)+0.9*(game.height/2);
    	this.draw();
    };
}

function Enemies(){ // Список врагов
	this.enemiesList = [];
	var imgEnemy = new Image();
    imgEnemy.src = "images/ufo.png";
	this.create = function()
	{
		if(this.enemiesList.length > 100) // ограничение на колличество врагов
			return;
		var e = new enemy(imgEnemy);
		e.draw();
		this.enemiesList.push(e);
	}
	this.update = function(fps){
		// удаляем не активные
		this.enemiesList = this.enemiesList.filter(function(e) {
			return e.active;
		});
		// обновляем позиции активных
		this.enemiesList.forEach(function(e){
			e.update(fps);
		});
	}
}

function explosion(x, y) // класс для отрисовки взрыва
{
	this.active = true;
	this.height = 62; // высота спрайта
	this.width = 62; // ширрина спрайта
	// переменные для перехода по изображению со спрайтами
	this.h = 3; // максимальная правая позиция спрайта
	this.v = 3; // максимальная нижняя позиция спрайта

	var imgExplosion = new Image();
    imgExplosion.src = "images/explosprite.png";
    
    this.draw = function(){
    	var offset_x = this.height*this.h;
    	var offset_y = this.width*this.v;
	    context.drawImage(imgExplosion, offset_x, offset_y, this.width, this.height, x, y, this.width, this.height);
	}

    this.update = function(fps)
    {
    	this.h -=1;
    	if(this.h == 0)
    	{
    		this.v -=1;
    		this.h = 3;
    	}
    	if(this.v < 0)
    	{
    		this.active = false; //конец взрыва
    	}
    }
}

function player(x, y, image) // класс игрока
{
	this.bonus = 0; // бонусы
	this.fail = 0; // столкновения с врагами
	this.x = x; // координата х
    this.y = y; // координата у
    this.height = 100;
    this.width = 100;
    this.spead = 50; // скорость
    this.bullets = []; // пули выпущенные игроком
    this.bangs = []; // взрывы во время попадания пули

    this.draw = function() // функция рисует прямоугольник согласно заданным параметрам
    {
        context.drawImage(image, this.x, this.y);
    };
    this.move = function(fps){
    	var x = (this.spead*pos.h*(1/fps));
    	if(this.x + x >= 0 && this.x + x <= game.width)
    		this.x += x;
    	var y = (this.spead*pos.v*(1/fps));
    	if(this.y + y >= 0 && this.y + y <= game.width)
    		this.y += y;
    }
    this.update = function(fps)
    {
    	this.move(fps);
    	var t = this
    	enemy1.enemiesList.forEach(function(e){
    		// проверяем колизии игрока
	    	if(pos.collides(t, e))
	    	{
	    		var bang = new explosion(e.x, e.y);
	    		bang.draw();
	    		t.bangs.push(bang);
	    		// начисляем бонус
	    		t.fail +=1;
	    		e.active = false;
	    	}

	    	// проверяем колизии пуль
	    	t.bullets.forEach(function(b){
    			if(pos.collides(b, e))
		    	{
		    		e.active = false;
		    		b.active = false;
		    		// создаём взрыв
		    		var bang = new explosion(e.x, e.y);
		    		bang.draw();
		    		t.bangs.push(bang);
		    		// начисляем бонус
		    		t.bonus +=1;
		    	}
    		});
    	});

    	//проверяем наличие выпущенных пуль
    	if(this.bullets.length > 0)
    	{
    		// проверяем видимость пуль
    		this.bullets = this.bullets.filter(function(bullet) {
				return bullet.active;
			});
    		// обновляем позиции пуль
    		this.bullets.forEach(function(bullet){
    			bullet.update(fps);
    		});
    	}

    	if(pos.bullet_active) //стреляем
    	{
    		var b = new bullet(this.x+(this.width), this.y+(this.height/2)+12);
    		b.draw();
    		this.bullets.push(b);
    	}

    	// проверяем взрывы в данный момент
    	if(this.bangs.length > 0)
    	{
    		// удаляем закончившиеся взрывы
    		this.bangs = this.bangs.filter(function(b) {
				return b.active;
			});
    		// обновляем существующие взрывы
    		this.bangs.forEach(function(b){
    			b.update(fps);
    			b.draw();
    		});
    	}
    };
}

function bullet(x, y) // класс пули
{
	this.x = x;
	this.y = y;
	this.active = true;
	this.width = 3;
	this.height = 2;
	this.color = "#FFF";
	this.spead = 300;

	this.draw = function(){
		context.fillStyle = this.color;
    	context.fillRect(this.x, this.y, this.width, this.height);
	}
	this.update = function(fps){
		this.x = this.x+this.spead*(1/fps); 
		if(this.x+this.width > game.width)
			this.active = false;
		else
    		this.draw();
	}

}

function update(fps) // изменения координат которые нужно произвести
{
	if(fps <= 0) fps = 60;
    player1.update(fps);
    enemy1.update(fps);
}

function draw() // рисуем на холсте
{
	requestAnimationFrame(draw);
	context.clearRect(0, 0, game.width, game.height);
    game.draw("#000", 1); // рисуем фон
    player1.draw();
    drawInfoBlock();
    update(fps); // обновляем координаты  

	var thisFrameFPS = 1000 / ((now=new Date) - lastUpdate);
	if (now!=lastUpdate){
		fps += (thisFrameFPS - fps) / fpsFilter;
		lastUpdate = now;
	}
}

function t() //для добавления врагов
{
	enemy1.create();
}

var fps = 0, now, lastUpdate = (new Date)*1;

var fpsFilter = 50;

function drawInfoBlock()
{
	context.textBaseline = "top";
	context.font = "16px Arial";
	context.fillStyle = "#46b84e";
	context.fillText("FPS: "+fps, 10, 10);
	context.fillText("Bonus: "+player1.bonus, 10, 30);
	context.fillStyle = "red";
	context.fillText("Losses: "+player1.fail, 10, 50);
}

function init() // Инициализация переменных
{
	pos = new position();
	game = new Game(); // прямоугольник закрашивающий фон
    var canvas = document.getElementById("example");
    canvas.width = game.width; // ширина холста
    canvas.height = game.height; // высота холста
    context = canvas.getContext("2d");

   // игрок
    var imgPlayer = new Image();
    imgPlayer.src = "images/space_s.png";
    player1 = new player(0, 0, imgPlayer);

    // препятствия
    enemy1 = new Enemies();
    enemy1.create();
    setInterval(t, 1000 ); // добавление новых врагов через интервал
    draw();
}