---
layout: post
title:  "Episerver Cms Toolbox, Part 1"
date:   2019-05-12 18:00:00 -0400
tags: ['episerver', 'nuget']
---
I have created many NuGet packages over these past few years, many have broken down into very specific focuses. My Episerver Cms Toolbox package is a push back against that. It is a collection of many useful concepts I have found to be very beneficial to my Episerver projects. I am going to cover one of those useful concepts in this post, a strategy based content area renderer.

Episerver's content rendering is but one of its many awesome features allowing the same piece of content to display in a variety of ways. This variety is generally controlled by options that can be passed in the Razor view files as seen below:

```cs
@Html.PropertyFor(x => x.CurrentPage.MainContentArea, new { CssClass = "row equal-height", tag = Global.ContentAreaTags.FullWidth })
```

These options are anonymous C# objects meaning developers do not get the benefit of strongly typed classes and intellisense. The first part of the toolbox I am going to show brings that missing part, strongly typed options:

```cs
public class ContentAreaRenderOptions
{
    public string ChildrenCssClass { get; set; }
    public string ChildrenCustomTagName { get; set; }
    public string CssClass { get; set; }
    public string CustomTag { get; set; }
    public bool HasContainer { get; set; }
    public bool Prefiltered { get; set; }
    public string Tag { get; set; }
    public IContentAreaItemRenderingStrategy ContentAreaItemRenderingStrategy { get; set; }
    public ITemplateResolverItemStrategy TemplateResolverItemRenderingStrategy { get; set; }
}
```

And used with the previous example the code now becomes:

```cs
@Html.PropertyFor(x => x.CurrentPage.MainContentArea, new ContentAreaRenderOptions { CssClass = "row equal-height", Tag = Global.ContentAreaTags.FullWidth })
```

Intellisense allows developers to easily see whats available with information about each option because to new developers Tag and CustomTag can be a bit confusing. A keen developer will also notice there are more properties there than a typical content area renderer needs which brings me to the next part of the toolbox, IContentAreaItemRenderingStrategy.

This interface allows for truly flexible content areas to change their needs depending on where they are used. In my experience, designers like to keep developers on their toes with cases like grouping N number of items per row, needing to know the position of an item while rendering and many other things. This is where the toolbox truly shines as in the toolbox there are several strategies provided by default:

* AlloyRenderingStrategy, based on Alloys content area renderer
* FirstLastItemRenderingStrategy, inserts a first/last CSS class to appropriate items.
* EvenOddItemRenderingStrategy, inserts even/odd CSS classes to items.
* ItemsPerRowGroupingStrategy, allows N items to be grouped in a row.
* NoChildContainerStrategy, keeps the child items from being wrapped in extra HTML tag.

More strategies can be easily added as well for other use cases, simply create a class IContentAreaItemRenderingStrategy and apply it to the options when rendering. There is also a default strategy provider interface IDefaultContentStrategy that by default does nothing but can be utilized to provide a strategy that fits the most use cases so they don't have to be continuously passed in via options.

There is also a Prefiltered property for use cases when building a ContentArea programmatically from some source that has been already filtered for a site visitor, such as search results.

The NuGet package for this strategy based content area rendering called **bmcdavid.Episerver.CmsToolbox.AspNet** and will be in the Episerver NuGet feed shortly. The source code is also on my [GitHub](https://github.com/bmcdavid/epi-cms-toolbox). The next post in this toolbox series will be leveraging interface attributes to provide Episerver UI information to allow developers to choose composition over inheritance.

Happing coding!