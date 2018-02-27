---
layout: page
title: Symfonyブログチュートリアル
permalink: /blog-tutorial
---

# 動作環境

Symfonyのバージョン Symfony3.4.x

動作検証環境

* Max OSX
* PHP: 7.1.13
* MySQL: 5.6

サンプルコードはこちらからダウンロードできます。
https://github.com/symfony-japan/symfony3_blog_tutorial

## 1. Symfonyのインストールと設定

PHPとcomposer、MySQLは事前にインストールしてください。

Symfony3.4をインストールする場合 [symfony-installer](https://github.com/symfony/symfony-installer) も利用することがきますが、Symfony4系では利用できなくなることからcomposerを使ったインストールをおすすめします。

以下コマンドを実行しsymfonyアプリケーションをインストールします。

```
$ composer create-project symfony/framework-standard-edition symfony_blog_tutorial "3.4.*"
```

インストール時にいくつか質問を聞かれますが、基本的にデフォルトのまま全部Enterでかまいません。Mysqlのユーザー名パスワードなど必要があればご自身の環境に合うように適宜変更してください。

<img width="552" alt="インストール時の画像" src="{{ site.baseurl }}/assets/img/tutorial/install-std-out.png">

Symfonyをphpビルトインwebサーバーで立ち上げます

```
$ bin/console server:start
```

http://127.0.0.1:8000/ にアクセスしてみて wellcomeページが表示されればインストールは成功です。


念のためマシンのSymfonyの動作環境が整っているか確認します。

```
$ cd symfony_blog_tutorial
$ bin/symfony_requirements

Symfony Requirements Checker
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

> PHP is using the following php.ini file:
  /Users/y.okada/.php/7.1.13/etc/php.ini

> Checking Symfony requirements:
  ............................................


 [OK]
 Your system is ready to run Symfony projects


Note  The command console could use a different php.ini file
~~~~  than the one used with your web server. To be on the
      safe side, please check the requirements from your web
      server using the web/config.php script.
```

OKと表示されていればひとまず動作させるのは問題はないでしょう。

以下のURLにアクセスすることでも確認ができます。
http://127.0.0.1:8000/config.php

## 2. ページの作成

インストールした時点で既に `src/AppBundle/Controller/DefaultController.php` というファイルがありますが、
さきほど表示されていたwelcomeページのコントローラがまさにこのファイルです。

```php
<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends Controller
{
    /**
     * @Route("/", name="homepage")
     */
    public function indexAction(Request $request)
    {
        return $this->render('default/index.html.twig', [
            'base_dir' => realpath($this->getParameter('kernel.project_dir')).DIRECTORY_SEPARATOR,
        ]);
    }
}
```

Symfonyのルーティング設定はデフォルトではアノテーションでコントローラーに直接記述します。アノテーションとは `@Route(....)` と記述されている部分で、この場合 http://127.0.0.1:8000/ にアクセスすると `indexAction()` を実行するように、URLとアクションのマッピング行っています。

では、早速ブログ作成のためのブログコントローラーとそのページを作成してみましょう。

コントローラー
`ｓｒｃ/AppBundle/Controller/BlogController.php`

```php
<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

/**
 * @Route("/blog")
 */
class BlogController extends Controller
{
    /**
     * @Route("/")
     */
    public function indexAction(Request $request)
    {
        return $this->render('blog/index.html.twig');
    }
}
```

テンプレートを作成します。
`app/Resources/views/blog/index.html.twig`

```twig
<h1>Blog posts</h1>
```

http://127.0.0.1:8000/blog/ へアクセスしてみると「Blog posts」とタイトルが表示されているでしょう。

## 3. エンティティ(モデル)の作成

多くのMVCフレームワークではモデルと呼ばれることが多いですが、Symfonyではモデルのとは区別してエンティティと呼びます。
エンティティとはデータを保持した普通のクラスです。

この章ではエンティティを作成して、データベースからデータを取ってきて画面に表示することろまでやってみましょう。

エンティティを生成するコマンドを実行します。

```
$ bin/console generate:doctrine:entity --entity=AppBundle:Post --fields="title:string(255) content:text createdAt:datetime updatedAt:datetime"
```

`generate:doctrine:entity` コマンド自体は対話的にエンティティ名やプロパティの指定を行えるのですが、今回は全部指定してあるので、全部Enterを押して進めてください。

エンティティとリポジトリというファイルが自動生成されます。

* `src/AppBundle/Entity/Post.php`
* `src/AppBundle/Repository/PostRepository.php`

### データベース&テーブル作成
MySQLの設定とparameters.ymlの設定・権限がうまくいっていれば、下記コマンドでデータベースとテーブルを作成することができます。

```
$ bin/console doctrine:database:create
Created database `symfony` for connection named default

$ php bin/console doctrine:schema:create
ATTENTION: This operation should not be executed in a production environment.

Creating database schema...
Database schema created successfully!
```

コントローラー

```php

use AppBundle\Entity\Post;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

/**
 * @Route("/blog")
 */
class BlogController extends Controller
{
    // ...
    /**
     * @Route("/")
     */
    public function indexAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $posts = $em->getRepository(Post::class)->findAll();

        return $this->render('blog/index.html.twig', [
            'posts' => $posts,
        ]);
    }
```

Controllerの先頭でuse文を追記してますので注意して下さい。
`$this->getDoctrine()->getManager()` でEntityManagerを取得し
`$em->getRepository()` でリポジトリクラスを取得します。そのリポジトリ経由でPostエンティティを取得してきます。
`findAll()`メソッドはリポジトリクラスが標準で備えているメソッドでデータベースのpostテーブルに登録されてている情報を全件取得してきます。

それではテンプレートで一覧を表示してみたいと思います。

{% raw %}
```twig
{# app/Resources/views/blog/index.html.twig #}
<h1>Blog posts</h1>
{% if posts | length > 0 %}
  <table class="table" border="1">
    <thead>
    <tr>
      <td>ID</td>
      <td>タイトル</td>
      <td>作成日</td>
    </tr>
    </thead>
    <tbody>
      {# posts配列をループして、投稿記事の情報を表示 #}
      {% for post in posts %}
        <tr>
          <td><a href="#">{{ post.id }}</a></td>
          <td>{{ post.title }}</td>
          <td>{{ post.createdAt|date('Y/m/d H:i') }}</td>
        </tr>
      {% endfor %}
    </tbody>
  </table>
{% else %}
  <p>No Posts</p>
{% endif %}
```
{% endraw %}

データベースにデータが入っていないので「No Posts」と表示されると思います。 それではデータベースにデータを入れてみます。

```sql
mysql> INSERT INTO Post (title, content, createdAt, updatedAt) values ('初めての投稿', '初めての投稿です。', NOW(), NOW());
```

再度アクセスすると追加した記事が表示されます。


## 4. 記事詳細ページの作成

続いて個別記事の詳細ページを作ります。

コントローラー

```php

class BlogController extends Controller
{
    // ...

    /**
     * @Route("/{id}")
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();
        $post = $em->getRepository(Post::class)->find($id);

        if (!$post) {
            throw $this->createNotFoundException('The post does not exist');
        }

        return $this->render('blog/show.html.twig', ['post' => $post]);
    }
}
```

テンプレート



{% raw %}
```twig
{# app/Resources/views/blog/show.html.twig #}
<h1>{{ post.title }}</h1>
<p><small>Created: {{ post.createdAt|date('Y/m/d H:i') }}</small></p>
<p>{{ post.content|nl2br }}</p>
```
{% endraw %}

以下のURLにアクセスしてみます。

http://127.0.0.1:8000/blog/1

記事の詳細が表示されます。

## 5. ページをリンクで結ぶ

記事一覧ページと記事詳細ページをリンクでつなぎます。

コントローラーの `@Route` アノテーションにname属性を付けて、テンプレートにリンクを記述します。

コントローラー

```php

class BlogController extends Controller
{
    /**
     * @Route("/", name="blog_index")
     */
    public function indexAction()
    // ...

    /**
     * @Route("/{id}", name="blog_show")
     */
    public function showAction($id)
    // ...
```

テンプレート(一覧)

{% raw %}
```twig
      {% for post in posts %}
        <tr>
          {# 詳細ページにリンク #}
          <td><a href="{{ path('blog_show', {id: post.id}) }}">{{ post.id }}</a></td>
          <td>{{ post.title }}</td>
          <td>{{ post.createdAt|date('Y/m/d H:i') }}</td>
        </tr>
```
{% endraw %}

テンプレート(詳細)

{% raw %}
```twig
<h1>{{ post.title }}</h1>
<p><small>Created: {{ post.createdAt|date('Y/m/d H:i') }}</small></p>
<p>{{ post.content|nl2br }}</p>
{# 戻るリンクを追加 #}
<p><a href="{{ path('blog_index') }}">一覧に戻る</a></p>
```
{% endraw %}


`@Route` アノテーションにname属性を付けることで、ルートに対して名前をつけることができます。そして付けたルート名を利用してテンプレート内でリンクを張る事ができます。

name属性を付けなくても、app_[コントローラー名]_[アクション名] というルート名が自動で割り当てられるます。上記コントローラーのアクションの場合　`app_blog_index` と `app_blog_show` になります 。

自動の割当のRute名を利用してもよいですが、　`app_xxxx_xxxx` という名前は冗長ですし、自分で簡素な名前を付けたほうが良いでしょう。

コントローラーにルーティングを書くのは一覧性が良くないのでは？と思う方もいるかもしれません。

けれども、Symfonyにはルート一覧を表示するコマンドがあります`bin/console debug:router を実行してみて下さい。 現在アプリケーションで有効になっているルーティング情報を見ることができます。

```
$ php bin/console debug:router
 -------------------------- -------- -------- ------ -----------------------------------
  Name                       Method   Scheme   Host   Path
 -------------------------- -------- -------- ------ -----------------------------------
  _wdt                       ANY      ANY      ANY    /_wdt/{token}
  _profiler_home             ANY      ANY      ANY    /_profiler/
  _profiler_search           ANY      ANY      ANY    /_profiler/search
  _profiler_search_bar       ANY      ANY      ANY    /_profiler/search_bar
  _profiler_phpinfo          ANY      ANY      ANY    /_profiler/phpinfo
  _profiler_search_results   ANY      ANY      ANY    /_profiler/{token}/search/results
  _profiler_open_file        ANY      ANY      ANY    /_profiler/open
  _profiler                  ANY      ANY      ANY    /_profiler/{token}
  _profiler_router           ANY      ANY      ANY    /_profiler/{token}/router
  _profiler_exception        ANY      ANY      ANY    /_profiler/{token}/exception
  _profiler_exception_css    ANY      ANY      ANY    /_profiler/{token}/exception.css
  _twig_error_test           ANY      ANY      ANY    /_error/{code}.{_format}
  blog_index                 ANY      ANY      ANY    /blog/
  blog_show                  ANY      ANY      ANY    /blog/{id}
  homepage                   ANY      ANY      ANY    /
 -------------------------- -------- -------- ------ -----------------------------------
```

※ _wdtや_profiler と追加した記憶のないルートが表示されているまが、WEBデバッグツールバーとプロファイラーのルートで開発を便利にするためのものですが、ここでは気にしなくて大丈夫です。

## 6. テンプレートの継承

symfonyで使われているテンプレートエンジンであるtwigはPHPのクラスと同様に継承をサポートしています。

ヘッダー等を共通で使いまわす部分を親のベーステンプレートに記述し、各ページはそれを継承してコンテンツ部分だけを上書きして使います。

ここではbootstarap4も導入してみます。bootstrapはtwitter社がオープンソースで出しているcss,jsライブラリーです。
簡単にきれいなデザインが利用できるようになります。
あとで出てきますが、symfonyのフォームは標準でbootstarap対応しており、きれいに整ったフォームを表示することができます。

まず、base.html.twigを作成。既にデフォルト生成されているものがあるため上書き修正してください。


{% raw %}
```twig
{# app/Resources/views/base.html.twig #}
<!doctype html>
<html>
<head>
  <meta charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
  <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>

  <title>{% block title %}{{ block('page_title') }} - Symfony Blog{% endblock title %}</title>
</head>
<body>
  <header class="navbar navbar-dark bg-primary">
    <div class="container">
      <h1 class="navbar-brand">Symfony Blog</h1>
    </div>
  </header>
  <div class="container">
    <div class="row">
      <h2>{% block page_title %}{% endblock page_title %}</h2>
    </div>

    {% block content %}{% endblock content %}

    <footer>
      <p>&copy; 2018 日本Symfonyユーザー会</p>
    </footer>
  </div>
</body>
</html>
```
{% endraw %}

{% raw %}
こちらがベースのテンプレートとなります。`{% block page_title %}`　と `{% block content %}` を用意し個別のページごとにこれらのブロックを上書きします。

これまでの章で作った `index.html.twig` と `show.html.twig` を実際に修正していきます。

さきほど記述していたHTMLタグを `{% block content %}` で囲むようにします。 その際ですが、`<h1>` タグは消して 代わりに `{% block page_title %}Blog Posts{% enfblock %}` を定義します。
{% endraw %}

{% raw %}
```twig
{# app/Resources/views/blog/index.html.twig #}
{% extends 'base.html.twig' %}

{% block page_title %}Blog posts{% endblock %}

{% block content %}
  <div class="row">
    {% if posts | length > 0 %}
      <table class="table table-bordered">
        <thead>
        <tr>
          <td>ID</td>
          <td>タイトル</td>
          <td>作成日</td>
        </tr>
        </thead>
        <tbody>
          {# posts配列をループして、投稿記事の情報を表示 #}
          {% for post in posts %}
            <tr>
              <td><a href="{{ path('blog_show', {id: post.id}) }}">{{ post.id }}</a></td>
              <td>{{ post.title }}</td>
              <td>{{ post.createdAt|date('Y/m/d H:i') }}</td>
            </tr>
          {% endfor %}
        </tbody>
      </table>
    {% else %}
      <p>No Posts</p>
    {% endif %}
  </div>
{% endblock %}
```
{% endraw %}

{% raw %}
```twig
{# app/Resources/views/blog/show.html.twig #}
{% extends 'base.html.twig' %}

{% block page_title %}{{ post.title }}{% endblock %}

{% block content %}
  <div class="row">
    <dl>
      <dt>作成日</dt>
      <dd><small>{{  post.createdAt|date('Y/m/d H:i') }}</small></dd>
      <dt>内容</dt>
      <dd>{{ post.content|nl2br }}</dd>
    </dl>
  </div>
  <div class="row">
    <a href="{{ path('blog_index') }}" class="btn btn-light">一覧に戻る</a>
  </div>
{% endblock %}
```
{% endraw %}

ページを表示してみるとbootstrapのスタイルが当たってきれいに表示されました。

テンプレートの継承を用いることでを用意することでcssやjsの読み込みなど共通に記述したい内容を1つのテンプレートにまとめることができました。


## 7. 記事の新規作成ページ

まずはコントローラーの修正から
記事を新規に作成するアクションを作成します。

```php
    /**
     * @Route("/new", name="blog_new")
     */
    public function newAction(Request $request)
    {
        // フォームの組立
        $form = $this->createFormBuilder(new Post())
            ->add('title')
            ->add('content')
            ->getForm();



        return $this->render('blog/new.html.twig', [
            'form' => $form->createView(),
        ]);
    }
```

テンプレート追加


{% raw %}
```twig
{# app/Resources/views/blog/new.html.twig #}

{% extends 'base.html.twig' %}

{% form_theme form 'bootstrap_4_horizontal_layout.html.twig' %}

{% block page_title '新規作成' %}

{% block content %}
  {{ form_start(form) }}
    {{ form_widget(form) }}
    <button type="submit" class="btn btn-primary">作成</button>
  {{ form_end(form) }}
{% endblock content %}
```
{% endraw %}

/blog/new というルートが出来たのでリンクを張ってみます。

index.html.twig に「新しい記事を書く」ボタンを設置

{% raw %}
```twig
{% block content %}
{# ここに新しい記事を書くボタンを設置 #}
<div class="row">
  <a class="btn btn-primary" href="{{ path('blog_new') }}">新しい記事を書く</a>
</div>

<table class="table">
  <thead>
    <tr>
        <td>ID</td>
        <td>タイトル</td>
        <td>作成日</td>
    </tr>
  </thead>
  <tbody>
  // ...
```
{% endraw %}

http://127.0.0.1:8000/blog/ へアクセスしてみます。

<img width="842" alt="記事一覧" src="{{ site.baseurl }}/assets/img/tutorial/blog-list.png">

「新しい記事を書く」ボタンが表示されたと思います。クリックしてみましょう。

http://127.0.0.1:8000/blog/new へアクセスすると404 Not Found とエラーが表示されていましました。

<img width="1045" alt="エラー" src="{{ site.baseurl }}/assets/img/tutorial/blog-new-error.png">

よく見てみると showAction() が実行されてエラーが発生していることが分かります。

これはnewAction()より上に定義したルートであるshowAction()の方が先にマッチしてしまうためです。

改めてさきほど定義した showAction()のルート設定を見てみましょう。

```php
/**
 * @Route("/{id}", name="blog_show")
 */
public function showAction($id)
```

ここで定義した `｛id｝` というプレースホルダーは特に指定がなければワイルドカード扱いであるため `/blog/xxxx`という全てのURLにマッチします。そのため `/blog/new` にアクセスしても showAction() が実行されてしまいました。

この問題を防ぐために、{id} は数字しかマッチしないようにします。requirements属性を利用するとそのプレースホルダーにマッチさせたい条件を正規表現で指定することができます。

```php
/**
 * @Route("/{id}", name="blog_show", requirements={"id"="\d+"})
 */
public function showAction($id)
```

改めてアクセスしてみましょう。新規作成画面が表示できました。

<img width="1143" alt="記事の新規作成ページ" src="{{ site.baseurl }}/assets/img/tutorial/blog-new.png">

`new.html.twig` に書いた、以下の指定がポイントで、formの要素に対してbootstrap4のテーマを適用することができました。

{% raw %}
```twig
{% form_theme form 'bootstrap_4_horizontal_layout.html.twig' %}
```
{% endraw %}


## 8. 記事登録機能の作成

```php
    /**
     * @Route("/new", name="blog_new")
     */
    public function newAction(Request $request)
    {
        // フォームの組立
        $post = new Post(); // 後で利用したいのでPostインスタンスを変数に入れます
        $form = $this->createFormBuilder($post)
            ->add('title')
            ->add('content')
            ->getForm();

        // PSST判定&バリデーション
        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            // エンティティを永続化
            $post->setCreatedAt(new \DateTime());
            $post->setUpdatedAt(new \DateTime());
            $em = $this->getDoctrine()->getManager();
            $em->persist($post);
            $em->flush();

            return $this->redirectToRoute('blog_index');
        }

        return $this->render('blog/new.html.twig', [
            'form' => $form->createView(),
        ]);
    }
```

`$form->handleRequest($request)` でフォームから送信されてきたデータは全てPostエンティティへマッピングされます。
EntityManagerクラスの `persist()` メソッドを呼び出しPostエンティティを新規に登録したいことをEntityManagerクラスへ知らせます。最後に `flush()` メソッドを呼び出しPostエンティティをデータベースへ保存します。

タイトルと内容を入力して作成ボタンを押してみましょう。
記事の作成に成功して一覧に戻ってきました。さきほど作った一覧が記事に表示されていることが確認できるでしょう。


## 9. バリデーションの追加

アプリケーションを開発する際には何かしらのバリデーションを設けることがほとんどでしょう。この章ではバリデーションを実装してみます。

アプリケーションのロケール設定が英語のままになっているので、このタイミングで日本語に変えておきましょう。日本語に変えておくことでエラーメッセージが日本語で表示されるようになります。
また、デフォルトでは自動翻訳が有効化されていないてめ、有効化しておきます。

```yaml
# app/config/config.yml
parameters:
    locale: ja # en → ja へ変更

framework:
    #esi: ~
    translator: { fallbacks: ['%locale%'] }　# この行がコメントアウトされているので有効化
```

```php
// src/AppBundle/Entity/Post.php

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

class Post
{
    // ...

    /**
     * @var string
     *
     * @ORM\Column(name="title", type="string", length=255)
     * @Assert\NotBlank()
     * @Assert\Length(min="2", max="50")
     */
    private $title;

    /**
     * @var string
     *
     * @ORM\Column(name="content", type="text")
     * @Assert\NotBlank()
     * @Assert\Length(min="10")
     */
    private $content;
```

簡易なバリデーションはアノテーションを用いてエンティティのフィールドごとに指定します。
クラス上部のuse文で@Assertを利用できるようにインポートしていることに注意していください。

実は前の章に書いたコントローラでバリデーションの実行はしています。

```php
// PSST判定&バリデーション
$form->handleRequest($request);
if ($form->isSubmitted() && $form->isValid()) {
    // ...
}
```

この部分がそうです。試しに内容を10文字以下にして作成ボタンを押してみましょう。

<img width="680" alt="" src="{{ site.baseurl }}/assets/img/tutorial/blog-new-validation.png">

日本語でエラーメッセージが表示されていますね。

もし、この他にどんなバリデーションを利用できるのか知りたければ一度公式のドキュメントに目を通してみるとよいでしょう。
https://symfony.com/doc/3.4/validation.html#basic-constraints


## 10. 削除機能の作成

削除アクションとテンプレートに削除ボタンを追加します。

コントローラーにdeleteActionを追加します。

```php
// src/AppBundle/Controller/BlogController.php
    /**
     * @Route("/{id}/delete", name="blog_delete", requirements={"id"="\d+"})
     */
    function deleteAction($id)
    {
        $em = $this->getDoctrine()->getManager();
        $post = $em->getRepository(Post::class)->find($id);
        if (!$post) {
            throw $this->createNotFoundException(
                'No post found for id '.$id
            );
        }
        // 削除
        $em->remove($post);
        $em->flush();

        return $this->redirectToRoute('blog_index');
    }
```

{% raw %}
```twig
{# app/Resources/views/blog/index.html.twig #}
      <table class="table table-bordered">
        <thead>
        <tr>
          <td>ID</td>
          <td>タイトル</td>
          <td>作成日</td>
          <td>操作</td>{# ここを追記 #}
        </tr>
        </thead>
        <tbody>
          {% for post in posts %}
            <tr>
              <td><a href="{{ path('blog_show', {id: post.id}) }}">{{ post.id }}</a></td>
              <td>{{ post.title }}</td>
              <td>{{ post.createdAt|date('Y/m/d H:i') }}</td>
              {# ここを追記 #}
              <td><a class="btn btn-danger" href="{{ path('blog_delete', {'id':post.id}) }}">削除</a></td>{# ここを追記 #}
            </tr>
          {% endfor %}
        </tbody>
      </table>
```
{% endraw %}

削除ボタンをおしてみましょう。一覧から記事が削除されることが確認できるでしょう。


# 11. 編集機能の作成

コントローラーにeditActionを追加します。

```php
// src/AppBundle/Controller/BlogController.php

    public function newAction(Request $request)
    {
        // ...

        return $this->render('blog/new.html.twig', [
            'post' => $post, // ここに追加
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}/edit", name="blog_edit", requirements={"id"="\d+"})
     */
    public function editAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $post = $em->getRepository(Post::class)->find($id);
        if (!$post) {
            throw $this->createNotFoundException(
                'No post found for id '.$id
            );
        }

        $form = $this->createFormBuilder($post)
            ->add('title')
            ->add('content')
            ->getForm();

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            // フォームから送信されてきた値と一緒に更新日時も更新して保存
            $post->setUpdatedAt(new \DateTime());
            $em->flush();

            return $this->redirectToRoute('blog_index');
        }

        // 新規作成するときと同じテンプレートを利用
        return $this->render('blog/new.html.twig', [
            'post' => $post,
            'form' => $form->createView(),
        ]);
    }
```

editActionはnewAcctionとあまり変わりません。違いは新規作成ではないので保存済みのリポジトリからpostクラスを一度取得して、それにフォームの値をマッピングします。

{% raw %}
また、編集フォームは登録フォームと表示項目も特に変わらないためそのまま利用します。 `new.thml.twig`　ではフォームをレンダリングするために `{{ form_start(form) }}` を利用していました。
{% endraw %}
このtwig関数を利用していれば、postクラスの状態から判断して、新規作成と編集とでPOST先のアクションを自動で切り替えてくれます。

ただしsubmitボタンが「作成」のままになっているため、編集する場合には「編集」とボタン表示の出し分けをしてあげましょう。

{% raw %}
```twig
{# app/Resources/views/blog/new.html.twig #}
  {{ form_start(form) }}
    {{ form_widget(form) }}
    <a class="btn btn-light" href="{{ path('blog_index') }}">一覧に戻る</a>
    <button type="submit" class="btn btn-primary">{{ post.id ? '編集' : '作成' }}</button>
  {{ form_end(form) }}
```
{% endraw %}

一覧ページに編集ボタンを追加します

{% raw %}
```twig
{# app/Resources/views/blog/index.html.twig #}

{% for post in posts %}
  <tr>
    <td><a href="{{ path('blog_show', {id: post.id}) }}">{{ post.id }}</a></td>
    <td>{{ post.title }}</td>
    <td>{{ post.createdAt|date('Y/m/d H:i') }}</td>
    <td>
      {# ここに編集ボタン追加 #}
      <a class="btn btn-info" href="{{ path('blog_edit', {'id': post.id}) }}">編集</a>
      <a class="btn btn-danger" href="{{ path('blog_delete', {'id': post.id}) }}">削除</a>
    </td>
  </tr>
{% endfor %}
```
{% endraw %}

編集ボタンをクリックすると記事の編集ができます。先程変更したsubmitボタンは「編集」と表示されているはずです。
新しい記事を書くボタンを押した場合には、submitボタンは作成と表示されています。

ブログのチュートリアルはここまでです。

ここから先はリファクタリングしながら、symfonyの便利機能を紹介していきます。

# 追加コンテンツ(予定)

* ParamConverterを利用したエンティティの取得
* FormTypeの導入
* createed_at, updated_atの自動挿入
* DIを用いてServiceクラスを導入
* ページネーション（ページング）の導入
* メール
* 翻訳(バリデーションエラーメッセージのカスタマイズ)
