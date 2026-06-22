<?php
/**
 * Footer.
 *
 * @package rentnova
 */
?>
<footer class="rn-footer">
	<div class="rn-footer__inner">
		<span class="rn-footer__name"><?php bloginfo( 'name' ); ?></span>
		<span class="rn-footer__copy">
			<?php
			/* translators: %s: current year. */
			printf( esc_html__( '© %s RentNova · Mississauga & the GTA', 'rentnova' ), esc_html( gmdate( 'Y' ) ) );
			?>
		</span>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
