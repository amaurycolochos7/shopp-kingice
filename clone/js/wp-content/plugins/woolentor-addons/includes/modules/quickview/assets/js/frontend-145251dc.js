;(function($){
 "use strict";
    
    var WooLentorQuickView = {

        body: $('body'),
        modal: $('#woolentor-quickview-modal'),
        modalbody: $('.woolentor-quickview-modal-body'),

        /**
         * [init]
         * @return {[void]} Initial Function
         */
        init: function(){
            this.wrapperHeight();
            $( document )
                .on( 'click.WooLentorQuickView', 'a.woolentor-quickview-btn,.woolentorquickview', this.openQuickView )
                .on( 'click.WooLentorQuickView', '.woolentor-quickview-modal-close', this.closeQuickView )
                .on( 'click.WooLentorQuickView', '.woolentor-quickview-overlay', this.closeQuickView );

            $( document ).keyup( this.closeKeyUp );

            if( woolentorQuickView.optionData['enableAjaxCart'] === 'on' ){
                $( document ).on( 'click.WooLentorQuickView', '.woolentor-quickview-modal-content .woolentorquickview-content-template:not(.external) .single_add_to_cart_button:not(.disabled)', this.addToCart );
            }

        },

        /**
         * [openQuickView] Open quickview
         * @param  event
         * @return {[void]}
         */
        openQuickView: function( event ){
            event.preventDefault();

            var $this = $(this),
                id = $this.data('product_id');

            WooLentorQuickView.modalbody.html(''); /*clear content*/
            WooLentorQuickView.body.addClass('woolentor-quickview-loader');

            if( woolentorQuickView?.optionData?.spinnerImageUrl.length > 0 ){
                 WooLentorQuickView.body.css('--woolentor-quick-view-spinner-image', 'url(' + woolentorQuickView?.optionData?.spinnerImageUrl + ')');
            }

            $this.addClass('loading');
            WooLentorQuickView.modal.addClass('loading');

            $.ajax({
                url: woolentorQuickView.ajaxUrl,
                data: {
                    action: 'woolentor_quickview',
                    id: id,
                    nonce: woolentorQuickView.ajaxNonce,
                },
                method: 'POST',
                success: function (response) {
                    if ( response ) {
                        WooLentorQuickView.body.removeClass('woolentor-quickview-loader');
                        WooLentorQuickView.modal.removeClass('loading').addClass('woolentor-quickview-open');
                        $this.removeClass('loading');

                        WooLentorQuickView.modalbody.html( response );
                        WooLentorQuickView.variation( WooLentorQuickView.modalbody );

                        $(document).trigger('woolentor_quick_view_rendered');

                        if( woolentorQuickView.optionData['thumbnailLayout'] === 'slider' ){
                            WooLentorQuickView.imageSlider();
                        }

                    } else {
                        console.log( 'Something wrong loading fetching product data' );
                    }
                },
                error: function (response) {
                    console.log('Something wrong with AJAX response.');
                },
                complete: function () {
                    $this.removeClass('loading');
                },
            });

        },

        /**
         * [variation] Product variation data manager
         * @param  {[String]} $container
         * @return {[void]} 
         */
        variation: function( $container ){

            var $formvariation = $container.find('.variations_form');
            $formvariation.each( function() {
                $( this ).wc_variation_form();
            });

            $formvariation.trigger( 'check_variations' );
            $formvariation.trigger( 'reset_image' );

            if( typeof $.fn.wc_product_gallery !== 'undefined' ) {
                $container.find('.woocommerce-product-gallery').each( function () {
                    $(this).wc_product_gallery();
                } );
            }

            if( woolentorQuickView.optionData['thumbnailLayout'] === 'slider' ){
                WooLentorQuickView.variationData( $container );
            }

        },

        /**
         * [variationData] Manage varition data
         * @param  {[String]} $product
         * @return {[void]}
         */
        variationData: function( $product ){

            $( '.single_variation_wrap' ).on( 'show_variation', function ( event, variation ) {
                $product.find('.woolentor-quickview-main-image-slider').slick('slickGoTo', 0);
            });

        },

        /**
         * [closeQuickView] Close quickview
         * @param  event
         * @return {[void]}
         */
        closeQuickView: function( event ) {
            event.preventDefault();
            WooLentorQuickView.modal.removeClass('woolentor-quickview-open');
        },

        /**
         * [closeKeyUp] Close quickview after press ESC Button
         * @param  event
         * @return {[void]}
         */
        closeKeyUp: function(event){
            if( event.keyCode === 27 ){
                WooLentorQuickView.modal.removeClass('woolentor-quickview-open');
            }
        },

        /**
         * [wrapperHeight] Manage Modal wrapper height
         * @return {[void]}
         */
        wrapperHeight: function(){
            var window_width = $(window).width(),
                window_height = $(window).height();

            $('.woolentor-quickview-modal-wrapper').css({"max-height": ( window_height-150 )+"px"});
        },

        /*
        * Cuctom image slider
        */
        MainImageSlider: function(){
            $('.woolentor-quickview-main-image-slider').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: true,
                fade: true,
                asNavFor: '.woolentor-quickview-thumbnail-slider',
                prevArrow: '<span class="woolentor-quickview-slick-prev">&#8592;</span>',
                nextArrow: '<span class="woolentor-quickview-slick-next">&#8594;</span>',
            });
        },
        ThumbnailSlider: function(){
            $('.woolentor-quickview-thumbnail-slider').slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                asNavFor: '.woolentor-quickview-main-image-slider',
                dots: false,
                arrows: true,
                focusOnSelect: true,
                prevArrow: '<span class="woolentor-quickview-slick-prev">&#8592;</span>',
                nextArrow: '<span class="woolentor-quickview-slick-next">&#8594;</span>',
            });
        },
        imageSlider: function(){
            this.MainImageSlider();
            this.ThumbnailSlider();
        },

        /**
         * [addToCart]
         * @param event
         */
        addToCart: function( event ){
            event.preventDefault();

            var $this = $(this),
                $form           = $this.closest('form.cart'),
                all_data        = $form.serialize(),
                product_qty     = $form.find('input[name=quantity]').val() || 1,
                product_id      = $form.find('input[name=product_id]').val() || $this.val(),
                variation_id    = $form.find('input[name=variation_id]').val() || 0;


            /* For Variation product */    
            var item = {},
                variations = $form.find( 'select[name^=attribute]' );
                if ( !variations.length) {
                    variations = $form.find( '[name^=attribute]:checked' );
                }
                if ( !variations.length) {
                    variations = $form.find( 'input[name^=attribute]' );
                }

                variations.each( function() {
                    var $thisitem = $( this ),
                        attributeName = $thisitem.attr( 'name' ),
                        attributevalue = $thisitem.val(),
                        index,
                        attributeTaxName;
                        $thisitem.removeClass( 'error' );
                    if ( attributevalue.length === 0 ) {
                        index = attributeName.lastIndexOf( '_' );
                        attributeTaxName = attributeName.substring( index + 1 );
                        $thisitem.addClass( 'required error' );
                    } else {
                        item[attributeName] = attributevalue;
                    }
                });

            var data = {
                product_id: product_id,
                product_sku: '',
                quantity: product_qty,
                variation_id: variation_id,
                variations: item,
                all_data: all_data,
            };

            var alldata = data.all_data + '&product_id='+ data.product_id + '&product_sku='+ data.product_sku + '&quantity='+ data.quantity + '&variation_id='+ data.variation_id + '&variations='+ JSON.stringify( data.variations ) +'&action=woolentor_quickview_insert_to_cart' +'&nonce='+woolentorQuickView.ajaxNonce;

            $( document.body ).trigger('adding_to_cart', [$this, data]);

            $.ajax({
                type: 'POST',
                url: woolentorQuickView.ajaxUrl,
                data: alldata,

                beforeSend: function (response) {
                    $this.removeClass('added').addClass('loading');
                },

                complete: function (response) {
                    $this.addClass('added').removeClass('loading');
                },

                success: function (response) {

                    if ( response.error & response.product_url ) {
                        window.location = response.product_url;
                        return;
                    } else {
                        $( document.body ).trigger( 'wc_fragment_refresh' );
                        $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $this]);
                    }

                },

            });

        }

    };

    $( document ).ready( function() {
        WooLentorQuickView.init();
        $( window ).on( 'resize', WooLentorQuickView.wrapperHeight );
    });
    
})(jQuery);