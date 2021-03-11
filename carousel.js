/**
 * Permet de rajouter la navigation tactile pour le carousel
 */

class CarouselTouchPlugin {

	/**
	 *
	 * @param {Carousel} carousel
	 */

	constructor (carousel) {
		carousel.container.addEventListener('dragstart', e => e.preventDefault())
		carousel.container.addEventListener('mousedown', this.startDrag.bind(this))
		carousel.container.addEventListener('touchstart', this.startDrag.bind(this))
		window.addEventListener('mousemove', this.drag.bind(this))
		window.addEventListener('touchmove', this.drag.bind(this))
		window.addEventListener('touchend', this.endDrag.bind(this))
		window.addEventListener('mouseup', this.endDrag.bind(this))
		window.addEventListener('touchcancel', this.endDrag.bind(this))
		this.carousel = carousel
	}

	/**
	 * Démarre le déplacement au touché
	 * @param {MouseEvent|TouchEvent} e
	 */
	startDrag(e) {
		if (e.touches) {
			if (e.touches.length > 1) {
				return
			} else {
				e = e.touches[0]
			}
		}
		this.origin = {x: e.screenX, y: e.screenY}
		this.width = this.carousel.containerWidth
		this.carousel.disableTransition()
	}

	/**
	 * Déplacement
	 * @param {MouseEvent|TouchEvent} e
	 */
	drag (e) {
		if (this.origin) {
			let point = e.touches ? e.touches[0] : e
			let translate = {x: point.screenX - this.origin.x, y: point.screenY - this.origin.y}
			if (e.touches && Math.abs(translate.x) > Math.abs(translate.y)) {
				e.preventDefault()
				e.stopPropagation()
			}
			let baseTranslate = this.carousel.currentItem * -100 / this.carousel.items.length
			this.lastTranslate = translate
			this.carousel.translate(baseTranslate + 100 * translate.x /this.width)
		}
	}

	/**
	 * Fin du déplacement
	 * @param {MouseEvent|TouchEvent} e
	 */
	endDrag (e) {
		if (this.origin && this.lastTranslate) {
			this.carousel.enableTransition()
			if (Math.abs(this.lastTranslate.x / this.carousel.carouselWidth) > 0.2) {
				if (this.lastTranslate.x < 0) {
					this.carousel.next()
				} else {
					this.carousel.prev()
				}
			} else {
				this.carousel.gotoItem(this.carousel.currentItem)
			}
		}
		this.origin = null
	}
}


class Carousel {

	/**
	 * @param {HTMLElement} element
	 * @param {Object} options
	 * @param {Object} [options.slidesToScroll=1] Nombre d'éléments à faire défiler
	 * @param {Object} [options.slidesVisible=1] Nombre d'éléments visible dans un slide
	 * @param {boolean} [options.loop=false] Doit-on boucler en fin de carousel
	 * @param {boolean} [options.infinite=false]
	 * @param {boolean} [options.pagination=false]
	 * @param {boolean} [options.navigation=true]
	 */

	constructor (element, options = {}) {
		this.element = element;
		this.options = Object.assign({}, {
			slidesToScroll: 1,
			slidesVisible: 1,
			loop: false,
			pagination: false,
			navigation: true,
			infinite: false
		}, options)
		let children = [].slice.call(element.children)
		this.isMobile = false
		this.currentItem = 0
		this.moveCallbacks = []
		this.offset = 0

		// Modification du DOM
		this.root = this.createDivWithClass('carousel')
		this.container = this.createDivWithClass('carousel__container')
		this.root.setAttribute('tabindex', '0')
		this.root.appendChild(this.container)
		this.element.appendChild(this.root)
		this.items = children.map((child) => {
			let item = this.createDivWithClass('carousel__item')
			item.appendChild(child)
			return item
		})
		if (this.options.infinite) {
			this.offset = this.options.slidesVisible + this.options.slidesToScroll
			this.items = [
				...this.items.slice(this.items.length - this.offset).map(item => item.cloneNode(true)),
				...this.items,
				...this.items.slice(0, this.offset).map(item => item.cloneNode(true))
			]
			this.gotoItem(this.offset, false)
		}
		this.items.forEach(item => this.container.appendChild(item))
		this.setStyle()
		if (this.options.navigation) {
			this.createNavigation()
		}
		if (this.options.pagination) {
			this.createPagination()
		}


		// Evenements
		this.moveCallbacks.forEach(cb => cb(this.currentItem))
		this.onWindowResize()
		window.addEventListener('resize', this.onWindowResize.bind(this))
		this.root.addEventListener('keyup', e => {
			if (e.key === 'ArrowRight' || e.key === 'Right') {
				this.next()
			} else if (e.key === 'ArrowLeft' || e.key === 'Left') {
				this.prev()
			}
		})
		if (this.options.infinite) {
			this.container.addEventListener('transitionend', this.resetInfinite.bind(this))
		}
		new CarouselTouchPlugin(this)

	}

	/**
	 * Applique les bonnes dimensions aux éléments du carousel
	 */

	setStyle () {
		let ratio = this.items.length / this.slidesVisible
		this.container.style.width = (ratio * 100) + "%"
		this.items.forEach(item => item.style.width = ((100 / this.slidesVisible) / ratio)  + "%")
	}

	/**
	 * Crée les flèches de navigation dans le DOM
	 */

	createNavigation () {
		let nextButton = this.createDivWithClass('carousel__next')
		let prevButton = this.createDivWithClass('carousel__prev')
		this.root.appendChild(nextButton)
		this.root.appendChild(prevButton)
		nextButton.addEventListener('click', this.next.bind(this))
		prevButton.addEventListener('click', this.prev.bind(this))
		if (this.options.loop === true) {
			return
		}
	}

	/**
	 * Crée la pagination dans le DOM
	 */

	createPagination () {
		let pagination = this.createDivWithClass('carousel__pagination')
		let buttons = []
		this.root.appendChild(pagination)
		for (let i = 0; i < (this.items.length - 2 * this.offset); i = i + this.options.slidesToScroll) {
			let button = this.createDivWithClass('carousel__pagination__button')
			button.addEventListener('click', () => this.gotoItem(i + this.offset))
			pagination.appendChild(button)
			buttons.push(button)
		}
		this.onMove(index => {
			let count = this.items.length - 2 * this.offset
			let activeButton = buttons[Math.floor(((index - this.offset) % count) / this.options.slidesToScroll)]
			if (activeButton) {
				buttons.forEach(button => button.classList.remove('carousel__pagination__button--active'))
				activeButton.classList.add('carousel__pagination__button--active')
			}
		})
	}

	translate (percent) {
		this.container.style.transform = 'translate3d(' + percent + '%, 0, 0)'
	}

	next () {
		this.gotoItem(this.currentItem + this.slidesToScroll)
	}

	prev () {
		this.gotoItem(this.currentItem - this.slidesToScroll)
	}

	/**
	 *  Déplace le carousel vers l'élément ciblé
	 * @param {number} index
	 * @param {boolean} [animation = true]
	 */

	gotoItem (index, animation = true) {
		if (index < 0) {
			if (this.options.loop) {
				index = this.items.length - this.slidesVisible
			} else {
				return
			}
		} else if (index >= this.items.length || (this.items[this.currentItem + this.slidesVisible] === undefined && index > this.currentItem)) {
			if (this.options.loop) {
				index = 0
			} else {
				return
			}

		}
		let translateX = index * -100 /this.items.length
		if (animation === false) {
			this.container.style.transition = 'none'
		}
		this.container.style.transform = 'translate3d(' + translateX +'%, 0, 0)'
		this.container.offsetHeight // force repaint
		if (animation === false) {
			this.container.style.transition = ''
		}
		this.translate(translateX)
		this.disableTransition()
		this.currentItem = index
		this.moveCallbacks.forEach(cb => cb(index))
	}

	/**
	 * Déplace le container pour donner l'impression d'un slide infini
	 */
	resetInfinite () {
		if (this.currentItem <= this.options.slidesToScroll) {
			this.gotoItem(this.currentItem + (this.items.length - 2 * this.offset), false)
		} else if (this.currentItem >= this.items.length - this.offset) {
			this.gotoItem(this.currentItem - (this.items.length - 2 * this.offset), false)
		}
	}

	onMove (cb) {
		this.moveCallbacks.push(cb)
	}

	onWindowResize () {
		let mobile = window.innerWidth < 800
		if (mobile !== this.isMobile) {
			this.isMobile = mobile
			this.setStyle()
			this.moveCallbacks.forEach(cb => cb(this.currentItem))
		}
	}

	/**
	 *
	 * @param {string} className
	 * @returns {HTMLElement}
	 */

	createDivWithClass (className) {
		let div = document.createElement('div')
		div.setAttribute('class', className)
		return div
	}

	disableTransition () {
		this.container.style.transition = 'none'
	}

	enableTransition () {
		this.container.style.transition = ''
	}

	/**
	 * @return {number}
	 */
	get slidesToScroll () {
		return this.isMobile ? 1 : this.options.slidesToScroll
	}

	/**
	 * @return {number}
	 */
	get slidesVisible () {
		return this.isMobile ? 1 : this.options.slidesVisible
	}

	/**
	 * @return {number}
	 */
	get containerWidth () {
		return this.container.offsetWidth
	}

	/**
	 * @returns {number}
	 */

	get carouselWidth () {
		return this.root.offsetWidth
	}


}

document.addEventListener('DOMContentLoaded', function() {

	new Carousel(document.querySelector('#carousel1'), {
		slidesToScroll: 1,
		slidesVisible: 1,
		loop: true,
		pagination: true
	})


})

