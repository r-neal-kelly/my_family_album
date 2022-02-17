// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/news", [
    "Mary/utils"
], function (utils) {

    const news_entries = [];

    function add_news_entry(date, text) {
        news_entries.push(`<h3>${date}</h3>${text.replace(/\n\n/g, "<br><br>")}<br>`);
    };

    add_news_entry("June 29, 2019", `
        We haven't added any photos this week because we have been focusing on binding as many
        photos as possible. That means scanning and organizing them as well. We hope that when
        we put the scans up on the site they will pretty much be in order already, even though
        I still need to add the functionality to the site that will allow use to modify the order
        of photos in an album. That's all for now, maybe more next week!
    `);

    add_news_entry("June 22, 2019", `
        We added another 20 pictures into the system, in a new album called "Beach Bonkers", so
        check it out! We also updated the site such that we can replace individual photos with
        better enhancements and also add any related photos we want. I've been spending most of
        this week working on physical photos, sorting and organizing them, and scanning tons of
        them. There's quite a few left, but I can almost see the finish line. That's it for this
        week, bye!
    `);

    add_news_entry("June 15, 2019", `
        We've added 248 pictures this week, most of them in "The Raulerson Stack", but another
        in "Yohe Visits" near the end. We updated the tags substantially this week, adding many
        thousands of instances to "Solo", "Inside", "Outside", "Daytime", "Nighttime", and many
        more. They of course, are not complete, we haven't yet done the newest photos. Mom has
        been adding even more detailed tags to some of the oldest albums. We changed the way that
        pictures are ordered in tag and filter galleries to reflect the order in which the photos
        were added into the website. I intend to update some functionalities of the website soon,
        that will allow us to reorder the photos in albums so that they make more sense. It should
        be the case that we can reorder our Favorites albums too.

        Something I'm a little sad about is the quality of enhancements for some of the photos on
        the site. So I will be adding functionality to update individual photos with better enhancements.
        Something I'm quite happy about is that we are now over 2000 default photos on the site! You
        can check the full numbers in the "Stats" window of the question mark menu.

        That's all (that I can remember) for this week, love you all, and goodnight!
    `);

    add_news_entry("June 8, 2019", `
        We've added 337 default pictures to "The Raulerson Stack". We accidentally added
        a duplicate that we will need to delete in the near future, but that duplicate is not
        counted in the above number. We also bound all of these photos into physical albums this
        week, so they are now much better off than they probably ever were before. We also added
        a useful tag called "Has Writing" which brings up photos with handwriting on them, either
        back or front.

        A little work was done behind the scenes on the server. That about sums up all the news
        this week concerning the site. Hope you enjoy the photos! Love Neal and Karen.
    `);

    add_news_entry("June 1, 2019", `
        We've got the ability to zip a gallery with its related photos working, and the
        max photos that can be zipped at one time has been increased to 1000. Keep in mind
        that related photos count towards this total. The total is there only because we
        do not have enough server resources available to us to make as large a zip as we
        would actually like, but this will do for now. And besides, I think that is plenty!

        We've added the ability to save your filter variables on your account, and we've
        disabled filter variables unless you're logged in. If there is any complaint with
        disabling variables for annonymous users, please let us know, and we will get back
        to you.

        I had a little trouble accessing the server for about 36 hours this week, so updates
        might be somewhat more sparse this time, but we are still going. I would like to point out
        that Namecheap, who is our web hosting company, fixed the problem promptly and courteously.
        While the server was inaccessible, we scanned hundreds of photos, which really needed
        to be done, so it works out! If you are having trouble accessing the site from a certain
        device, whether that be a laptop or phone, and yet it works on another, please let us know
        because it may be connected to the recent downtime.

        Also, we updated the comment editor so that it no longer auto-saves, but rather confirms
        any changes before leaving the photo, in case you forgot to save.

        We added twelve more default photos to the site! I know that 12 may not sound like much,
        but the way we are adding photos now is through the internet, and uploading them directly
        to the site is much more complicated than what we were doing before with our offline
        editor. I'm very happy that we got it working this week, which took a lot of time! The new
        photos are in a new album called "The Raulerson Stack", and you can find it on the front page.
        Next week, we think we'll be able to add a lot more photos now that we are done with most of
        the coding, but we'll have to see.

        That's it for this week, I hope any family members reading this enjoys the new updates to
        the site. Love you! - Neal
    `);

    add_news_entry("May 25, 2019", `
        This week we've made huge changes to the site and the server especially, making
        logins more stable. Registration should be fully working, so sign up if you want!
        We've been adding editing capabilities into the site, so that we have no need of
        a separate editor. We've finished implementing some of the key features, including
        tagging and commenting, but we were unable to add the necessary functionality that
        allows us to add more photos to the site. I'm sorry to say that this is the first
        week where we haven't been able to add any photos. But next week we hope to have
        everything up and working again.

        By the way, we haven't made it so that any user can add tags or comments, at least
        not yet. Currently only Mom and I have access to these editor features in our accounts.
        But if you are interested in doing some tagging or commenting of your own, please let
        us know and we'll get back to you promptly!

        Next week I'll be focusing on adding photos again, because we've got lots of them!
        Love you - Neal.
    `);

    add_news_entry("May 18, 2019", `
        This week we've added 25 photos to "Karen's Cache" which are a real treat to see.
        We've significantly increased the speed of the website loading, which was caused by
        a silly bug in the context-menu code. It's extremely fast to load up the site from
        the index or from a link now! We've gotten rid of that annoying thing where if you
        clicked on the big view of a picture, it would try to download it. We've replaced that
        with yet another...you guessed it, another context menu which you can access by
        right-clicking or tapping and holding on the big view of any picture. We've also been
        working on making more physical albums this week and server related stuff too.

        Oh, and we've added logins. It's taken me a while to set them up, but it's something
        I've been wanting for a while now. With logins, you can save info on the server through
        your account. Right now, we allow each user to save photos to their "Favorites" album.
        But we have more planned for the future. This site is really only intended for my family
        and so when it comes to Terms of Service and stuff like that, one of the qualifying
        requirements is that you be a part of my family. We may write up an actual Terms of Service
        soon though, in case you want to wait. Also I understand it's customary to have a Privacy
        Policy as well, we'll try to get on that.

        Well, anyways, much love, and write to you soon!
    `);

    add_news_entry("May 11, 2019", `
        We've added a new album that we've only just started, with 32 pics called "Yohe Visits"!
        This week we've been hard at work making physical albums, in fact we managed to get
        all of Maw Maw's photos tidied up in their binders, which is amazing to see. We've
        also added a new functionality to the website, where you can zip up individual albums,
        tags, or filters. You have to right click on the album or tag, or alternatively, the title
        bar inside the thumbs view to be able to zip. Currently, it's not finished, but it is
        working, and we hope to complete it soon. Just so you know, currently, the whichever
        sub option you choose when you zip doesn't matter, but we will make it so that you can add
        the related pics soon. Hope you enjoy the updates, more to come next week!
    `);

    add_news_entry("May 4, 2019", `
        Just a quick update this time, Sephy's folder now how 123 pics in it, check out that
        cute old cat! Also, I've been working a lot on the server side recently. More to
        come later. Sorry for the short update this week. Love you guys!
    `);

    add_news_entry("April 27, 2019", `
        Another 173 default photos have been added to the site! You can find them in "Karen's
        Cache (The Powells)", starting at number 92 in that album. Lot's of goodies in there.

        We've added a work in progress context menu to each thumb in the thumbs view. Right click
        on a thumb with your mouse, or tap and hold it for a second on your touch screen to bring
        it up. The menu is sparse at the moment, but we have some things to add to it later on.
        Right now, you can use it to 'download' the high quality version of a pic. On apple products,
        it will take you to the picture and you can save it manually, but other devices will download
        it in a more user friendly way. The context menu is one of the first steps to adding a rather
        important functionality to the site, but more to come in time.

        Actually, we managed to add a 'get link' button to the context menu, which allows you to
        directly link to a specific photo on the site. We urge you to try it out and send each other
        photo links.

        Love you, and hope you enjoy the photos! We are nearing the half-way point of our original
        estimation as regards the number of photos we have to put online. But there may be more yet!
        Until next time, love Neal.
    `);

    add_news_entry("April 20, 2019", `
        We've added another 78 photos to the site! They are found in the album called "Karen's Cache
        (The Powells)", which also contains 12 other pictures that were previously in an album called
        "General (The Powells)." We've been working a lot on tagging pictures and fixing any
        bugs we find, but also working on the editor that is used to make this site. We have some
        more functionality planned in the future, so stay tuned to any news on that front. Another
        thing we did is that we changed how this info page looks, it's much cleaner and it now has a
        "Stats" sub menu which you should check out. We'll be adding more to this sub menu as we think
        of things that we should keep track of! We've added some cool tags that you should check out.
        They all start with the word "Has", which when you type into the filter input on the top page,
        should bring up all the tags. They let you know which photos have opposites, overlays, alternates,
        and originals. Make sure to use them if you want to find those photos in particular. Yet another
        thing we added is an options sub menu under the filter that you can use. One option that might
        come in handy is to have every filter always fuzzy, which makes it easier to type out filter
        expressions. There are other options that we will most likely be adding soon.

        I think this update makes 10 weeks worth of work on this project so far. There is much left to be
        done, including adding more photos, related pics, tags, comments, but also making physical
        albums.

        I almost forgot! We added an entirely new operator for the filter, it's the "comment" operator
        and it allows you to find photos with comments you are looking for. We went ahead and added
        all of Nana's old comments that we had previously, and now they are as easy to find as putting
        "@Nana" into the filter bar. Well anyways, hope you enjoy the pictures, and we love you. Bye!

        Almost forgot again! Molly, if you happen to be reading, we determined several pictures that have
        you and/or your sisters and brother and parents in them. Just search for your names in the filter!
        Let us know if we mispelled anything and we'll fix it. Bye!
    `);

    add_news_entry("April 13, 2019", `
        We believe we have finished adding to Maw Maw's Stash! The last 158 default
        photos have been added to it. We still have to put originals, alternates, and overlays
        in the album, but they will come in time. A lot of changes have been made to the code
        this week, trying to make the program more robust, and fixing errors. We added a nice
        help section to the tags filter, hopefully it will be useful. The filter is not as scary as
        you might think, but it's likely more powerful than you realize. Try it out! It also
        has a work in progress variables section, but more on that another time. We hope you
        are still enjoying the pictures. We now have brought the default photos total up to 
        1154! A neat trick you can do with the filter, is to simply push the check mark without
        any expressions, and it will show all the pictures on the site. We'll be sure to add more
        tags in the future, to make the filter more and more useful as we go. Bye for now!
    `);

    add_news_entry("April 6, 2019", `
        We've added a whole new album this week, "The Powell Henderson Family Album"! It's
        scans of a physical album we've made. It's intended to be an extension of 
        "Our Family Album (The Powells)", which was missing a lot of key people who 
        ought to be in that album, but it's also a continuation in that it brings the album
        more up to date. Make sure to check it out!
        We've added another 131 photos to "Maw Maw's Stash"! The new pics start
        from number 204 up to and including the last pic in the album.

        Major updates to the site! We now have tag filtering.
        Also, we have tags better ordered on the main page.
        The thumb nails should be a lot smoother now as well, less jumping around.
        There is now a total photo count in the title bar for each gallery, found in the
        thumbs view.
        The title of the current gallery, and the picture number is now found in the menu
        for each picture. We added buttons for albums too, because some pictures are found
        in multiple albums, but more importantly, now you can go to that album when you are
        looking at a picture from a tag gallery or a filter gallery.
        Additionally, when you click either an album or a tag button in the menu, it takes
        you to that gallery and then scrolls to the picture you were just looking at,
        whatever page in the gallery that might be.
        We also added a popup asking you to confirm if you want to leave the page, in
        case you meant to push the "up button" instead. If it's very annoying, please
        let us know.
        I believe the tags cutting off at the bottom of the menu when it needs to scroll
        is no longer occurring.
    `);

    add_news_entry("March 30, 2019", `
        We added one photo to "46th Anniversary (The Hendersons)", a newspaper clip which
        really belongs with the rest of the album, and we also added one hundred and one photos
        to "Maw Maw's Stash (The Hendersons)". There is also a new album, and we called it
        "The Good Ole Spots and Stripes (The Raulersons)". It depicts a certain extremely
        cute old cat, who's super sweet and loveable, certainly the greatest gift an aunt ever
        gave to her nephew. We're sure to add more into this album, as well as Maw Maw's Stash
        hopefully next week!

        We've been adding lots of tags too, because we plan to make it so that you can combine
        tags to narrow down pictures that you might be looking for. I would like to have this
        functionality prototyped and working online in the next couple of weeks. Currently,
        most of the tags are not complete, and we know that there are pics which ought to have
        a certain tag, but don't. It takes time to tag everything with each appropiate tag. We
        would also like to include some more functionality in the options, in the menu, and
        with the server (more on this later.)

        This week, we also made huge updates to the code, but I won't bore you with that.
        However, if there are any quirks or problems, any annoyances with how the site works,
        let us know about them, and we will try to fix them.

        We are currently at 700 default photos on the site, but that doesn't include the "opposites",
        "overlays", "alternates", and "originals", which bring the total up to 763 photos, excluding
        thumb nails. We aren't anywhere near done yet, and we'll be trying to add more default photos
        and more related photos in the coming weeks!

        I am really happy that you all are finding the site so pleasing. I do not believe I would be
        doing this at all if it weren't for all of you. You've given me something good to do.
        Love you guys - Neal.
    `);

    add_news_entry("March 23, 2019", `
        We've begun adding Maw Maw's stash of photos! Some of them you may have seen not too long
        ago, but others you may not have seen for years, if ever! We've made a lot of changes to
        the site as well, primarily we've added 'pages' for thumbs, instead of lumping them all
        together on one massive page. Now there are 50 thumbs per page, and you can use the left
        and right arrows when looking at thumbs to go to another page. One more huge change is
        that we added a 'menu' system, which you can use when looking at the big version of each photo.
        Inside the menu there will be tags for each photo, which you can click on to go to that gallery.
        Also, you may find that some pictures have a text comment, and even buttons that allow you to look
        at various pictures related to the current photo you are looking at. More information is to come
        when we add more of these related photos into the system! We have also added an option to view
        thumbnails as either circles (the current default) or squares. You can change how the thumbs are
        displayed by clicking the button in the 'options' section of this page! See above. Much love,
        and I hope you enjoy the pictures! - Neal
    `);

    add_news_entry("March 16, 2019", `
        Another album added, "Fishing and Stuff (The Powells)"! We've been working hard
        on making physical albums this week, so that all the original photos will be preserved.
        We haven't had the time to touch the code much, and so we have to push the functionality
        we have planned yet another week. But something we aim for next week, is getting a large
        chunk, if not the whole, of Maw Maw's old photos online. Lot's of Henderson material there!
        Have fun, and enjoy the memories! Remember, there's still time to make more. Love you Kevin,
        Kim, Linda, and the rest of you! - Neal
    `);

    add_news_entry("March 9, 2019", `
        Hello again! Updated the site with two albums, and we've added a new tag system. Try
        clicking on one of the tags at the bottom of the main page! Also, the search bar
        should help you in finding any of these tags, just in case there are too many.
        We added a single click download of the whole site too, which gets you a zip of all
        the photos, tags, and everything! The button is it at the bottom of this page, but it
        may not work on your phone, you'll probably need a desktop or laptop to save it. And
        next week, we hope to unveil our new comment system! Also, make sure to bug mom
        more. We love you! - Neal
    `);

    add_news_entry("March 2, 2019", `
        Hello Kevin, Kim, Linda, and family! Glad you stopped by. Hope
        the site is easy to use! One hint, the back button on your browser will cause you
        to leave the site. Sorry for any trouble. Make sure to use the on-screen 
        arrows instead! The site is a work in progress. More albums are to come. 
        Try adding the site to your phone's "home screen." Karen says hi :-)
    `);

    return news_entries.join("");;

});
