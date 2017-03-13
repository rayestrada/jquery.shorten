/*
 * jQuery Shorten plugin 1.1.0
 *
 * Copyright (c) 2014 Viral Patel
 * http://viralpatel.net
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */

/*
 ** updated by Jeff Richardson
 ** Updated to use strict,
 ** IE 7 has a "bug" It is returning undefined when trying to reference string characters in this format
 ** content[i]. IE 7 allows content.charAt(i) This works fine in all modern browsers.
 ** I've also added brackets where they weren't added just for readability (mostly for me).
 */

(function (factory) {
  if(typeof module === "object" && typeof module.exports === "object") {
    factory(require("jquery"), window, document);
  } else {
    factory(jQuery, window, document);
  }
}(function($, window, document, undefined) {
  $.fn.shorten = function(settings) {
    "use strict";

    var config = {
      showChars: 100,
      minHideChars: 10,
      ellipsesText: "...",
      moreText: "more",
      lessText: "less",
      onLess: function() {},
      onMore: function() {},
      errMsg: null,
      force: false
    };

    if (settings) {
      $.extend(config, settings);
    }

    if ($(this).data('jquery.shorten') && !config.force) {
      return false;
    }

    $(this).data('jquery.shorten', true);

    $(document).off('click', '.morelink');

    $(document).on({
      click: function() {

        var $this = $(this);
        if ($this.hasClass('less')) {
          $this.removeClass('less');
          $this.html(config.moreText);
          $this.parent().prev().prev().show();
          $this.parent().prev().hide(0, function() {
            config.onLess();
          });

        } else {
          $this.addClass('less');
          $this.html(config.lessText);
          $this.parent().prev().prev().hide();
          $this.parent().prev().show(0, function() {
            config.onMore();
          });
        }
        return false;
      }
    }, '.morelink');

    return this.each(function() {
      var $this = $(this);

      var content = $this.html().trim();
      var contentlen = content.length;
      var nextSpaceIndex = content.substr(config.showChars, contentlen - config.showChars).indexOf(' '); // Index of the first space in the text to hide
      var newShowChars = config.showChars + nextSpaceIndex;

      if (contentlen > newShowChars + config.minHideChars) {
        var c = content.substr(0, newShowChars);
        if (c.indexOf('<') >= 0) // If there's HTML don't want to cut it
        {
          var inTag = false; // I'm in a tag?
          var bag = ''; // Put the characters to be shown here
          var countChars = 0; // Current bag size
          var openTags = []; // Stack for opened tags, so I can close them later
          var tagName = null;

          for (var i = 0, r = 0; r <= newShowChars; i++) {
            if (content[i] == '<' && !inTag) {
              inTag = true;

              // This could be "tag" or "/tag"
              tagName = content.substring(i + 1, content.indexOf('>', i));

              // If its a closing tag
              if (tagName[0] == '/') {


                if (tagName != '/' + openTags[0]) {
                  config.errMsg = 'ERROR en HTML: the top of the stack should be the tag that closes';
                } else {
                  openTags.shift(); // Pops the last tag from the open tag stack (the tag is closed in the retult HTML!)
                }

              } else {
                // There are some nasty tags that don't have a close tag like <br/>
                if (tagName.toLowerCase() != 'br') {
                  openTags.unshift(tagName); // Add to start the name of the tag that opens
                }
              }
            }
            if (inTag && content[i] == '>') {
              inTag = false;
            }

            if (inTag) {
              bag += content.charAt(i);
            } // Add tag name chars to the result
            else {
              if (countChars <= newShowChars) {
                bag += content.charAt(i); // Fix to ie 7 not allowing you to reference string characters using the []
                countChars++;
              } else // Now I have the characters needed
              {
                if (openTags.length > 0) // I have unclosed tags
                {
                  for (j = 0; j < openTags.length; j++) {
                    bag += '</' + openTags[j] + '>'; // Close all tags that were opened
                  }
                  break;
                }
              }
            }
            r++;
          }
          c = $('<div/>').html(bag + '<span class="ellip">' + config.ellipsesText + '</span>').html();
        }else{
          c+=config.ellipsesText;
        }

        var html = '<div class="shortcontent">' + c +
          '</div><div class="allcontent">' + content +
          '</div><span><a href="javascript://nop/" class="morelink">' + config.moreText + '</a></span>';

        $this.html(html);
        $this.find(".allcontent").hide(); // Hide all text
        $('.shortcontent > *:last', $this).css('margin-bottom', 0); //Remove bottom margin on last paragraph as it's likely shortened
      }
    });

  };
}));