const navigation = document.querySelector('header');
const item1 = document.querySelector('#test');
const item2 = document.querySelector('#test2');
const item3 = document.querySelector('#test3');
const item4 = document.querySelector('#test4');
const item5 = document.querySelector('#test5');
const item6 = document.querySelector('.transform');


window.addEventListener('scroll', () => {
	if(window.scrollY > 30){

		navigation.classList.add('anim-nav');
		item1.classList.add('color-a');
		item2.classList.add('color-a');
		item3.classList.add('color-a');
		item4.classList.add('color-a');
		item5.classList.add('color-a');
		item6.classList.add('color-a');
	}
	else
	{
		navigation.classList.remove('anim-nav');
		item1.classList.remove('color-a');
		item2.classList.remove('color-a');
		item3.classList.remove('color-a');
		item4.classList.remove('color-a');
		item5.classList.remove('color-a');
		item6.classList.remove('color-a');
	}
})