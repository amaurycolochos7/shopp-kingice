(function ($, window) {
  "use strict";

  var WooLentorBlocks = {
    /**
     * [init]
     * @return {[void]} Initial Function
     */
    init: function () {
      this.TabsMenu($(".ht-tab-menus"), ".ht-tab-pane");
      this.TabsMenu($(".woolentor-product-video-tabs"), ".video-cus-tab-pane");
      if ($("[class*='woolentorblock-'] .ht-product-image-slider").length > 0) {
        this.productImageThumbnailsSlider($(".ht-product-image-slider"));
      }
      this.thumbnailsimagescontroller();
      this.ThumbNailsTabs(
        ".woolentor-thumbanis-image",
        ".woolentor-advance-product-image-area"
      );
    },

    /**
     * [TabsMenu] Active first menu item
     */
    TabsMenu: function ($tabmenus, $tabpane) {
      $tabmenus.on("click", "a", function (e) {
        e.preventDefault();
        var $this = $(this),
          $target = $this.attr("href");
        $this
          .addClass("htactive")
          .parent()
          .siblings()
          .children("a")
          .removeClass("htactive");
        $($tabpane + $target)
          .addClass("htactive")
          .siblings()
          .removeClass("htactive");

        // slick refresh
        if ($(".slick-slider").length > 0) {
          var $id = $this.attr("href");
          $($id).find(".slick-slider").slick("refresh");
        }
      });
    },

    /**
     *
     * @param {TabMen area selector} $tabmenu
     * @param {Image Area} $area
     */
    ThumbNailsTabs: function ($tabmenu, $area) {
      $($tabmenu).on("click", "li", function (e) {
        e.preventDefault();
        var $image = $(this).data("wlimage");
        if ($image) {
          $($area)
            .find(".woocommerce-product-gallery__image .wp-post-image")
            .attr("src", $image);
          $($area)
            .find(".woocommerce-product-gallery__image .wp-post-image")
            .attr("srcset", $image);
        }
      });
    },

    /**
     * Slick Slider
     */
    initSlickSlider: function ($block) {
      $($block).css("display", "block");
      var settings = WooLentorBlocks.sanitizeObject($($block).data("settings"));
      if (settings) {
        var arrows = settings["arrows"];
        var dots = settings["dots"];
        var autoplay = settings["autoplay"];
        var rtl = settings["rtl"];
        var autoplay_speed = parseInt(settings["autoplay_speed"]) || 3000;
        var animation_speed = parseInt(settings["animation_speed"]) || 300;
        var fade = false;
        var pause_on_hover = settings["pause_on_hover"];
        var display_columns = parseInt(settings["product_items"]) || 4;
        var scroll_columns = parseInt(settings["scroll_columns"]) || 4;
        var tablet_width = parseInt(settings["tablet_width"]) || 800;
        var tablet_display_columns =
          parseInt(settings["tablet_display_columns"]) || 2;
        var tablet_scroll_columns =
          parseInt(settings["tablet_scroll_columns"]) || 2;
        var mobile_width = parseInt(settings["mobile_width"]) || 480;
        var mobile_display_columns =
          parseInt(settings["mobile_display_columns"]) || 1;
        var mobile_scroll_columns =
          parseInt(settings["mobile_scroll_columns"]) || 1;

        $($block)
          .not(".slick-initialized")
          .slick({
            arrows: arrows,
            prevArrow:
              '<button type="button" class="slick-prev"><i class="fa fa-angle-left"></i></button>',
            nextArrow:
              '<button type="button" class="slick-next"><i class="fa fa-angle-right"></i></button>',
            dots: dots,
            infinite: true,
            autoplay: autoplay,
            autoplaySpeed: autoplay_speed,
            speed: animation_speed,
            fade: fade,
            pauseOnHover: pause_on_hover,
            slidesToShow: display_columns,
            slidesToScroll: scroll_columns,
            rtl: rtl,
            responsive: [
              {
                breakpoint: tablet_width,
                settings: {
                  slidesToShow: tablet_display_columns,
                  slidesToScroll: tablet_scroll_columns,
                },
              },
              {
                breakpoint: mobile_width,
                settings: {
                  slidesToShow: mobile_display_columns,
                  slidesToScroll: mobile_scroll_columns,
                },
              },
            ],
          });
      }
    },

    /**
     * Slick Nav For As Slider Initial
     * @param {*} $sliderwrap
     */
    initSlickNavForAsSlider: function ($sliderwrap) {
      $($sliderwrap).find(".woolentor-learg-img").css("display", "block");
      $($sliderwrap).find(".woolentor-thumbnails").css("display", "block");
      var settings = WooLentorBlocks.sanitizeObject($($sliderwrap).data("settings"));

      if (settings) {
        $($sliderwrap)
          .find(".woolentor-learg-img")
          .not(".slick-initialized")
          .slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: settings["mainslider"].dots,
            arrows: settings["mainslider"].arrows,
            fade: false,
            asNavFor: ".woolentor-thumbnails",
            prevArrow:
              '<button class="woolentor-slick-large-prev"><i class="sli sli-arrow-left"></i></button>',
            nextArrow:
              '<button class="woolentor-slick-large-next"><i class="sli sli-arrow-right"></i></button>',
          });
        $($sliderwrap)
          .find(".woolentor-thumbnails")
          .not(".slick-initialized")
          .slick({
            slidesToShow: settings["thumbnailslider"].slider_items,
            slidesToScroll: 1,
            asNavFor: ".woolentor-learg-img",
            centerMode: false,
            dots: false,
            arrows: settings["thumbnailslider"].arrows,
            vertical: settings["thumbnailslider"].slidertype,
            focusOnSelect: true,
            prevArrow:
              '<button class="woolentor-slick-prev"><i class="sli sli-arrow-left"></i></button>',
            nextArrow:
              '<button class="woolentor-slick-next"><i class="sli sli-arrow-right"></i></button>',
          });
      }
    },

    /**
     * Accordion
     */
    initAccordion: function ($block) {
      var settings = $($block).data("settings");
      if ($block.length > 0) {
        var $id = $block.attr("id");
        new Accordion("#" + $id, {
          duration: 500,
          showItem: settings.showitem,
          elementClass: "htwoolentor-faq-card",
          questionClass: "htwoolentor-faq-head",
          answerClass: "htwoolentor-faq-body",
        });
      }
    },

    /**
     * Senitize HTML
     */
    sanitizeHTML: function (str) {
      if( str ){
        return str.replace(/[&<>"']/g, function (c) {
            switch (c) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return c;
            }
        });
      }else{
        return '';
      }
    },

    /**
     * Object Sanitize
     */
    sanitizeObject: function (inputObj) {
      const sanitizedObj = {};

      for (let key in inputObj) {
          if (inputObj.hasOwnProperty(key)) {
              let value = inputObj[key];
  
              // Sanitize based on the value type
              if (typeof value === 'string') {
                  // Sanitize strings to prevent injection
                  sanitizedObj[key] = WooLentorBlocks.sanitizeHTML(value);
              } else if (typeof value === 'number') {
                  // Ensure numbers are valid (you could also set limits if needed)
                  sanitizedObj[key] = Number.isFinite(value) ? value : 0;
              } else if (typeof value === 'boolean') {
                  // Keep boolean values as they are
                  sanitizedObj[key] = value;
              } else {
                  // Handle other types if needed (e.g., arrays, objects)
                  sanitizedObj[key] = value;
              }
          }
      }
  
      return sanitizedObj;
    },

    /*
     * Tool Tip
     */
    woolentorToolTips: function (element, content) {
      if (content == "html") {
        var tipText = element.text();
      } else {
        var tipText = element.attr("title");
      }
      element.on("mouseover", function () {
        if ($(".woolentor-tip").length == 0) {
          element.before('<span class="woolentor-tip">' + WooLentorBlocks.sanitizeHTML(tipText) + "</span>");
          $(".woolentor-tip").css("transition", "all 0.5s ease 0s");
          $(".woolentor-tip").css("margin-left", 0);
        }
      });
      element.on("mouseleave", function () {
        $(".woolentor-tip").remove();
      });
    },

    woolentorToolTipHandler: function () {
      $("a.woolentor-compare").each(function () {
        WooLentorBlocks.woolentorToolTips($(this), "title");
      });
      $(
        ".woolentor-cart a.add_to_cart_button,.woolentor-cart a.added_to_cart,.woolentor-cart a.button"
      ).each(function () {
        WooLentorBlocks.woolentorToolTips($(this), "html");
      });
    },

    /*
     * Universal product
     */
    productImageThumbnailsSlider: function ($slider) {
      $slider.slick({
        dots: true,
        arrows: true,
        prevArrow:
          '<button class="slick-prev"><i class="sli sli-arrow-left"></i></button>',
        nextArrow:
          '<button class="slick-next"><i class="sli sli-arrow-right"></i></button>',
      });
    },

    thumbnailsimagescontroller: function () {
      this.TabsMenu($(".ht-product-cus-tab-links"), ".ht-product-cus-tab-pane");
      this.TabsMenu($(".ht-tab-menus"), ".ht-tab-pane");

      // Countdown
      $(".ht-product-countdown").each(function () {
        var $this = $(this),
          finalDate = $(this).data("countdown");
        var customlavel = $(this).data("customlavel");
        $this.countdown(finalDate, function (event) {
          $this.html(
            event.strftime(
              '<div class="cd-single"><div class="cd-single-inner"><h3>%D</h3><p>' +
              WooLentorBlocks.sanitizeHTML(customlavel.daytxt) +
                '</p></div></div><div class="cd-single"><div class="cd-single-inner"><h3>%H</h3><p>' +
                WooLentorBlocks.sanitizeHTML(customlavel.hourtxt) +
                '</p></div></div><div class="cd-single"><div class="cd-single-inner"><h3>%M</h3><p>' +
                WooLentorBlocks.sanitizeHTML(customlavel.minutestxt) +
                '</p></div></div><div class="cd-single"><div class="cd-single-inner"><h3>%S</h3><p>' +
                WooLentorBlocks.sanitizeHTML(customlavel.secondstxt) +
                "</p></div></div>"
            )
          );
        });
      });
    },

    /**
     * Single Product Quantity Increase/decrease manager
     */
    quantityIncreaseDescrease: function ($area) {
      $area
        .find("form.cart")
        .on(
          "click",
          "span.wl-quantity-plus, span.wl-quantity-minus",
          function () {
            const poductType = $area.data("producttype");
            // Get current quantity values
            if ("grouped" != poductType) {
              var qty = $(this).closest("form.cart").find(".qty:visible");
              var val = parseFloat(qty.val());
              var min_val = 1;
            } else {
              var qty = $(this)
                .closest(".wl-quantity-grouped-cal")
                .find(".qty:visible");
              var val = !qty.val() ? 0 : parseFloat(qty.val());
              var min_val = 0;
            }

            var max = parseFloat(qty.attr("max"));
            var min = parseFloat(qty.attr("min"));
            var step = parseFloat(qty.attr("step"));

            // Change the value if plus or minus
            if ($(this).is(".wl-quantity-plus")) {
              if (max && max <= val) {
                qty.val(max);
              } else {
                qty.val(val + step);
              }
            } else {
              if (min && min >= val) {
                qty.val(min);
              } else if (val > min_val) {
                qty.val(val - step);
              }
            }
          }
        );
    },

    CartTableHandler: function () {
      // Product Details Slide Toggle
      $('body').on("click", '.woolentor-cart-product-details-toggle', function (e) {
          e.preventDefault();
          
          const $target = $(this).data('target');

          if($(`[data-id="${$target}"]`).is(':hidden')) {
              $(`[data-id="${$target}"]`).slideDown();
          } else {
              $(`[data-id="${$target}"]`).slideUp();
          }
      });
    },

    /**
     * Initialize View Switcher for Grid/List Tab Layout
     */
    viewSwitcher: function ( $grid, $selector, $style = 'modern' ) {
      const $viewButtons = $grid.find( '.woolentor-layout-btn' );

      if ( $viewButtons.length === 0 ) {
        return; // No view switcher, probably grid or list only mode
      }

      $viewButtons.on( 'click', function( e ) {
        e.preventDefault();

        const $this = $(this);
              const layout = $this.data('layout');
              const $gridContainer = $this.closest('.woolentor-product-grid, .woolentor-filters-enabled').find($selector);

              // console.log($gridContainer,$selector, $this);

              // Update active button state
              $this.siblings().removeClass('woolentor-active');
              $this.addClass('woolentor-active');

              // Update grid container layout classes
              if ($gridContainer.length > 0) {
                  // Remove existing layout classes from container
                  $gridContainer.removeClass('woolentor-layout-grid woolentor-layout-list');

                  // Add new layout class to container
                  $gridContainer.addClass('woolentor-layout-' + layout);
                  $gridContainer.attr('data-show-layout', layout);

                  // Update product card classes
                  const $productCards = $gridContainer.find('.woolentor-product-card');
                  $productCards.removeClass('woolentor-grid-card woolentor-list-card');
                  
                  if (layout === 'grid') {
                    if($style === 'editorial'){
                        $productCards.removeClass('woolentor-editorial-list-card');
                        $productCards.addClass('woolentor-editorial-grid-card');
                    }else if($style === 'magazine'){
                        $productCards.removeClass('woolentor-magazine-list-card');
                        $productCards.addClass('woolentor-magazine-grid-card');
                    }else{
                        $productCards.addClass('woolentor-grid-card');
                    }
                } else if (layout === 'list') {
                    if($style === 'editorial'){
                        $productCards.removeClass('woolentor-editorial-grid-card');
                        $productCards.addClass('woolentor-editorial-list-card');
                    }else if($style === 'magazine'){
                        $productCards.removeClass('woolentor-magazine-grid-card');
                        $productCards.addClass('woolentor-magazine-list-card');
                    }else{
                        $productCards.addClass('woolentor-list-card');
                    }
                }

              }


        // Trigger custom event for potential extensions
        $grid.trigger( 'woolentor:viewChanged', [ layout ] );
      });
    },

    /**
     * Initialize Quantity Selectors (List View)
     */
    quantitySelectors: function( $grid ) {
      // Plus button
      $grid.on( 'click', '.woolentor-qty-plus', function( e ) {
        e.preventDefault();

        const $button = $( this );
        const $input = $button.siblings( '.woolentor-qty-input' );
        const currentValue = parseInt( $input.val() ) || 1;
        const max = parseInt( $input.attr( 'max' ) ) || 999;

        if ( currentValue < max ) {
          $input.val( currentValue + 1 ).trigger( 'change' );
        }
      });

      // Minus button
      $grid.on( 'click', '.woolentor-qty-minus', function( e ) {
        e.preventDefault();

        const $button = $( this );
        const $input = $button.siblings( '.woolentor-qty-input' );
        const currentValue = parseInt( $input.val() ) || 1;
        const min = parseInt( $input.attr( 'min' ) ) || 1;

        if ( currentValue > min ) {
          $input.val( currentValue - 1 ).trigger( 'change' );
        }
      });

      // Sync quantity input with add to cart button
      $grid.on( 'change', '.woolentor-qty-input', function() {
        const $input = $( this );
        const quantity = $input.val();
        const $cartButton = $input.closest( '.woolentor-product-actions' ).find( '.woolentor-cart-btn' );

        if ( $cartButton.length ) {
          $cartButton.attr( 'data-quantity', quantity );
        }
      });
    },

    /**
     * LoadMore Product Ajax Action handeler
     * @param {String} gridArea // gridArea area Selector
     */
    loadMore: function( $gridArea ){

      let loadMoreButton = $gridArea.find('.woolentor-load-more-btn');

      if (loadMoreButton.length > 0) {

        loadMoreButton.on('click', function(e) {
          e.preventDefault();
      
          const $button = loadMoreButton;
          const uniqIdentifire = $button.data('grid-id');
          const $loader = $button.siblings('.woolentor-ajax-loader');
          const $grid = $('#' + uniqIdentifire);
          const currentPage = parseInt($button.data('page'));
          const maxPages = parseInt($button.data('max-pages'));
          const dataLayout = $grid.attr('data-show-layout');

          const loadMoreWrapper = $('.' + uniqIdentifire).find('.woolentor-ajax-enabled');
      
          if (currentPage > maxPages) {
            return;
          }
      
          $button.hide();
          $loader.show();
      
        let settings = loadMoreWrapper.attr( 'data-wl-widget-settings' );
      
          // Prepare AJAX data
          const ajaxData = {
            action: 'woolentor_load_more_products',
            nonce: typeof window?.woolentorLocalizeData !== 'undefined' ? window?.woolentorLocalizeData.security : '',
            page: currentPage,
            settings: settings,
            viewlayout: typeof dataLayout === 'undefined' ? '' : dataLayout
          };
      
          // AJAX request to load more products
          $.ajax({
            url: typeof window?.woolentorLocalizeData !== 'undefined' ? window?.woolentorLocalizeData.ajaxUrl : '',
            type: 'POST',
            data: ajaxData,
            success: function(response) {
              if (response.success && response.data.html) {

                // Append new products
                const $newProducts = $(response.data.html);
                $grid.append($newProducts);
                  
                // Update page counter
                $button.data('page', currentPage+1);
      
                // Show button if more pages available
                if (currentPage < maxPages) {
                  $button.show();
                } else {
                  $button.text($button.data('complete-loadtxt')).prop('disabled', true).show();
                }
              }
              $loader.hide();
            },
            error: function(xhr, status, error) {
              $loader.hide();
              $button.show();
              console.log("Status:", status, "Error:", error);
            }
          });
        });
      }

    },

    infiniteScroll: function($gridArea){

      let selectorBtn = $gridArea.find('.woolentor-infinite-scroll');

      let isLoading = false;
      const uniqIdentifire = selectorBtn.data('grid-id');
      const productLoadWrapper = $('.' + uniqIdentifire).find('.woolentor-ajax-enabled');
      const $loader = selectorBtn.find('.woolentor-ajax-loader');
      const $grid = $('#' + uniqIdentifire);
      const paginationArea = productLoadWrapper.find('.woolentor-pagination-infinite');

      function loadMoreOnScroll() {
          if (isLoading) return;

          // Calculate trigger point based on product grid bottom position
          const gridOffset = $grid?.offset()?.top;
          const gridHeight = $grid.outerHeight();
          const gridBottom = gridOffset + gridHeight;
          const scrollTop = $(window).scrollTop();
          const windowHeight = $(window).height();
          const triggerPoint = gridBottom - windowHeight - 100; // 100px before grid end

          if (scrollTop >= triggerPoint) {
              const currentPage = parseInt(selectorBtn.data('page'));
              const maxPages = parseInt(selectorBtn.data('max-pages'));

              if (currentPage > maxPages) {
                  $(window).off('scroll', loadMoreOnScroll);
                  return;
              }

              paginationArea.css('margin-top', '30px');
              isLoading = true;
              $loader.show();

              let settings = productLoadWrapper.attr( 'data-wl-widget-settings' );
              const dataLayout = $grid.attr('data-show-layout');

              // AJAX request to load more products
              $.ajax({
                  url: typeof woolentor_addons !== 'undefined' ? woolentor_addons.woolentorajaxurl : '',
                  type: 'POST',
                  data: {
                      action: 'woolentor_load_more_products',
                      nonce: typeof woolentor_addons !== 'undefined' ? woolentor_addons.ajax_nonce : '',
                      page: currentPage,
                      settings: settings,
                      viewlayout: typeof dataLayout === 'undefined' ? '' : dataLayout
                  },
                  success: function(response) {
                      if (response.success && response.data.html) {
                          // Append new products
                          const $newProducts = $(response.data.html);
                          $grid.append($newProducts);

                          // Update page counter
                          selectorBtn.data('page', currentPage + 1);

                          // Check if we've reached the last page
                          if (currentPage > maxPages) {
                              $(window).off('scroll', loadMoreOnScroll);
                              selectorBtn.remove();
                          }
                      }
                  },
                  complete: function() {
                      $loader.hide();
                      isLoading = false;
                      paginationArea.css('margin-top', '0');
                  },
                  error: function() {
                      $loader.hide();
                      isLoading = false;
                  }
              });
          }
      }

      // Bind scroll event
      $(window).on('scroll', loadMoreOnScroll);

    },

    // Product Grid Related Script
    initProductGridModern: function(){
      // Initialize all product grids on the page
      $( "[class*='woolentorblock-'] .woolentor-product-grid" ).each( function() {
        const $grid = $( this );

        if( $grid.hasClass('woolentor-style-editorial') ) {
          WooLentorBlocks.viewSwitcher( $grid, '.woolentor-product-grid-editorial', 'editorial' );
        }else if( $grid.hasClass('woolentor-style-magazine') ) {
          WooLentorBlocks.viewSwitcher( $grid, '.woolentor-product-grid-magazine', 'magazine' );
        }else{
          WooLentorBlocks.viewSwitcher( $grid, '.woolentor-product-grid-modern' );
        }

        // Quantity Selectors
        WooLentorBlocks.quantitySelectors( $grid );

        // LoadMore
        WooLentorBlocks.loadMore($grid);

        // Infinite Scroll
        WooLentorBlocks.infiniteScroll($grid);
      });

    }



  };

  $(document).ready(function () {
    WooLentorBlocks.init();
    WooLentorBlocks.CartTableHandler();
    WooLentorBlocks.initProductGridModern();

    $("[class*='woolentorblock-'] .product-slider").each(function () {
      WooLentorBlocks.initSlickSlider($(this));
    });

    $("[class*='woolentorblock-'].woolentor-block-slider-navforas").each(
      function () {
        WooLentorBlocks.initSlickNavForAsSlider($(this));
      }
    );

    $("[class*='woolentorblock-'] .htwoolentor-faq").each(function () {
      WooLentorBlocks.initAccordion($(this));
    });

    $("[class*='woolentorblock-'].woolentor-product-addtocart").each(
      function () {
        WooLentorBlocks.quantityIncreaseDescrease($(this));
      }
    );

    /**
     * Tooltip Manager
     */
    WooLentorBlocks.woolentorToolTipHandler();
  });

  // For Editor Mode Slider
  document.addEventListener(
    "WoolentorEditorModeSlick",
    function (event) {
      let editorMainArea = $(".block-editor__container"),
        editorIframe = $("iframe.edit-site-visual-editor__editor-canvas"),
        productSliderDiv =
          editorIframe.length > 0
            ? editorIframe
                .contents()
                .find("body.block-editor-iframe__body")
                .find(
                  `.woolentorblock-editor-${event.detail.uniqid} .product-slider`
                )
            : editorMainArea.find(
                `.woolentorblock-editor-${event.detail.uniqid} .product-slider`
              );
      window.setTimeout(
        WooLentorBlocks.initSlickSlider(productSliderDiv),
        1000
      );
    },
    false
  );

  // For Editor Mode Nav For As Slider
  document.addEventListener(
    "WoolentorEditorModeNavForSlick",
    function (event) {
      let editorMainArea = $(".block-editor__container"),
        editorIframe = $("iframe.edit-site-visual-editor__editor-canvas"),
        navForAsSliderDiv =
          editorIframe.length > 0
            ? editorIframe
                .contents()
                .find("body.block-editor-iframe__body")
                .find(
                  `.woolentorblock-editor-${event.detail.uniqid} .woolentor-block-slider-navforas`
                )
            : editorMainArea.find(
                `.woolentorblock-editor-${event.detail.uniqid} .woolentor-block-slider-navforas`
              );
      window.setTimeout(
        WooLentorBlocks.initSlickNavForAsSlider(navForAsSliderDiv),
        1000
      );
    },
    false
  );

  // Product Grid Modern Editor Script Run
  document.addEventListener( "wooLentorProductGridModern", function (event) { WooLentorBlocks.initProductGridModern() }, false );
  document.addEventListener( "wooLentorProductGridEditorial", function (event) { WooLentorBlocks.initProductGridModern() }, false );
  document.addEventListener( "wooLentorProductGridMagazine", function (event) { WooLentorBlocks.initProductGridModern() }, false );

})(jQuery, window);
