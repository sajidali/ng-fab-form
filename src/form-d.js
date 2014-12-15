angular.module('ngFabForm')
    .directive('form', function ($compile, $timeout, ngFabForm)
    {
        'use strict';
        // HELPER FUNCTIONS
        var preventFormSubmit = function (ev)
        {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
        };

        var setupDisabledForms = function (el, attrs)
            {
                // watch disabled form if set (requires jQuery)
                if (attrs.disableForm) {
                    el.wrapInner('<fieldset>');
                    var fieldSetWrapper = el.children();
                    attrs.$observe('disableForm', function ()
                    {
                        // NOTE attrs get parsed as string
                        if (attrs.disableForm === 'true' || attrs.disableForm === true) {
                            fieldSetWrapper.attr('disabled', true);
                        } else {
                            fieldSetWrapper.removeAttr('disabled');
                        }
                    });
                }
            },


            scrollToAndFocusFirstErrorOnSubmit = function (el, formCtrl, scrollAnimationTime, scrollOffset)
            {
                var scrollTargetEl = el[0].querySelector('.ng-invalid');
                if (scrollTargetEl && formCtrl.$invalid) {
                    var scrollTop = scrollTargetEl.offsetTop + scrollOffset;

                    // if no jquery just go to element
                    if (!window.$ || !scrollAnimationTime) {
                        window.scrollTo(0, scrollTop);
                        scrollTargetEl.focus();
                    }

                    // otherwise scroll to element
                    else {
                        var scrollActualAnimationTime = scrollAnimationTime;
                        var $scrollTargetEl= angular.element(scrollTargetEl);
                        $scrollTargetEl.addClass('is-scroll-target');
                        if (scrollAnimationTime) {
                            if (scrollAnimationTime === 'smooth') {
                                scrollActualAnimationTime = (Math.abs(window.scrollY - scrollTop)) / 4 + 200;
                            }
                            $('html, body').animate({
                                scrollTop: scrollTop
                            }, scrollActualAnimationTime, function ()
                            {
                                $scrollTargetEl.focus();
                                $scrollTargetEl.removeClass('is-scroll-target');
                            });
                        }
                    }
                }
            };


        return {
            restrict: 'E',
            scope: false,
            require: 'form',
            compile: function (el, attrs)
            {
                var config = angular.copy(ngFabForm.config);

                var formCtrlInCompile,
                    scopeInCompile,
                    formSubmitDisabledTimeout,
                    formSubmitDisabledTimeoutLength = config.preventDoubleSubmitTimeoutLength;


                // autoset novalidate
                if (!attrs.novalidate && config.setNovalidate) {
                    // set name attribute if none is set
                    el.attr('novalidate', true);
                    attrs.novalidate = true;
                }


                // SUBMISSION HANDLING
                el.bind('submit', function (ev)
                {
                    // set dirty if option is set
                    if (config.setFormDirtyOnSubmit) {
                        scopeInCompile.$apply(function ()
                        {
                            formCtrlInCompile.$triedSubmit = true;
                        });
                    }

                    // prevent submit for invalid if option is set
                    if (config.preventInvalidSubmit && !formCtrlInCompile.$valid) {
                        preventFormSubmit(ev);
                    }

                    // prevent double submission if option is set
                    else if (config.preventDoubleSubmit) {
                        if (formCtrlInCompile.$preventDoubleSubmit) {
                            preventFormSubmit(ev);
                        }

                        // cancel timeout if set before
                        if (formSubmitDisabledTimeout) {
                            $timeout.cancel(formSubmitDisabledTimeout);
                        }

                        formCtrlInCompile.$preventDoubleSubmit = true;
                        formSubmitDisabledTimeout = $timeout(function ()
                        {
                            formCtrlInCompile.$preventDoubleSubmit = false;
                        }, formSubmitDisabledTimeoutLength);
                    }

                    if (config.scrollToAndFocusFirstErrorOnSubmit) {
                        scrollToAndFocusFirstErrorOnSubmit(el, formCtrlInCompile, config.scrollAnimationTime, config.scrollOffset);
                    }
                });
                // /SUBMISSION HANDLING


                /**
                 * linking function
                 */
                return function (scope, el, attrs, formCtrl)
                {
                    formCtrlInCompile = formCtrl;
                    scopeInCompile = scope;

                    /**
                     * NOTE: order is important
                     * all submit-handlers are attached via bind first,
                     * so the last attached handler comes first
                     */


                    if (config.disabledForms) {
                        setupDisabledForms(el, attrs);
                    }


                    // don't forget to cancel set timeouts
                    scope.$on('$destroy', function ()
                    {
                        if (formSubmitDisabledTimeout) {
                            $timeout.cancel(formSubmitDisabledTimeout);
                        }
                    });
                };
            }
        };
    })
;
