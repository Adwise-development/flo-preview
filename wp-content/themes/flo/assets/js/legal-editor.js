/**
 * Strony prawne — kanwa edytora = front w trybie `post-only` (domyślny w WP 7.1).
 *
 * W `post-only` kanwa nie zawiera szablonu, więc nie ma `main.flo-legal`, na którym opiera się `assets/css/legal.css`.
 * Skrypt dodaje klasę `flo-legal-canvas` na <body> iframe kanwy, gdy edytowana strona ma szablon `legal`
 * i tryb renderowania to `post-only` (w `template-locked` styl daje prawdziwy `.flo-legal`). Inne strony i front:
 * bez klasy, bez wpływu. Sama klasa nic nie robi — wartości są w legal.css (jedno źródło, Z-01).
 */
( function () {
	const data = window.wp && window.wp.data;
	if ( ! data ) {
		return;
	}

	const CLASS = 'flo-legal-canvas';
	let bodyObserver = null;
	let observedBody = null;
	let queued = false;

	function wanted() {
		const ed = data.select( 'core/editor' );
		if ( ! ed || ! ed.getEditedPostAttribute ) {
			return false;
		}
		const mode = ed.getRenderingMode ? ed.getRenderingMode() : 'post-only';
		return (
			ed.getEditedPostAttribute( 'template' ) === 'legal' &&
			mode === 'post-only'
		);
	}

	function apply() {
		queued = false;
		const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		const body =
			frame && frame.contentDocument && frame.contentDocument.body;
		if ( ! body ) {
			return;
		}
		const on = wanted();
		if ( body.classList.contains( CLASS ) !== on ) {
			body.classList.toggle( CLASS, on );
		}
		// React potrafi nadpisać className body kanwy: pilnujemy klasy na bieżącym body.
		if ( observedBody !== body ) {
			if ( bodyObserver ) {
				bodyObserver.disconnect();
			}
			observedBody = body;
			bodyObserver = new window.MutationObserver( schedule );
			bodyObserver.observe( body, {
				attributes: true,
				attributeFilter: [ 'class' ],
			} );
			frame.addEventListener( 'load', schedule );
		}
	}

	function schedule() {
		if ( ! queued ) {
			queued = true;
			window.requestAnimationFrame( apply );
		}
	}

	data.subscribe( schedule );
	// Iframe pojawia się/wymienia po starcie edytora (zmiana trybu): obserwuj drzewo admina tanim wywołaniem schedule.
	new window.MutationObserver( schedule ).observe( document.body, {
		childList: true,
		subtree: true,
	} );
	schedule();
} )();
