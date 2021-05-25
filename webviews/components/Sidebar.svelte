<script lang="ts">
  import { onMount } from "svelte";

  let flag = false;
  let imgElement = document.getElementsByTagName("img")[0];
  let seenMemes = [];
  if (imgElement) {
    seenMemes.push(imgElement.src);
  }
  let temp: Promise<string> = null;
  class Meme {
    url: string;
    title: string;

    constructor(url: string, title: string) {
      this.url = url;
      this.title = title;
    }
  }

  class MemeService {
    async getMemes(): Promise<Meme[]> {
      const response = await fetch("https://meme-api.herokuapp.com/gimme");
      return await response.json();
    }
  }

  let apiClient = new MemeService();
  const fetchImage = async () => {
    const response = await fetch("https://meme-api.herokuapp.com/gimme");
    return await response.json();
  };

  const handleNextBtnClick = () => {
    if (imgElement) {
      seenMemes.push(imgElement.src);
    }
    apiClient.getMemes().then((memes) => {
      console.log("next btn is clicked");
      console.log(memes.url);
      temp = memes;
      flag = true;
    });
  };

  const handlePreviousBtnClick = () => {
    console.log("prev btn is clicked");
    let imgElement = document.getElementsByTagName("img")[0];
    if (imgElement) {
      // imgElement.src = storedElement && storedElement.toString();
      imgElement.src = seenMemes.length > 0 && seenMemes.pop();
    }
  };
  $: memeFetch = fetchImage;
</script>

<div class="container">
  {#await memeFetch()}
    <p>Getting you top quality Meme!</p>
  {:then data}
    <p>Here it is!</p>
    {#if flag}
      <a href={temp.url}>
        <img src={temp.url} alt="Meme" id="meme-img" />
      </a>
      <h3>{temp.title}</h3>
    {:else}
      <a href={data.url}>
        <img src={data.url} alt="Meme" />
      </a>
      <h3>{data.title}</h3>
    {/if}
  {:catch}
    <p>Something went wrong!</p>
  {/await}
  <div class="button-stack">
    <button class="btn previous-btn" on:click={handlePreviousBtnClick}>
      Bring me last one!
    </button>
    <button class="btn next-btn" on:click={handleNextBtnClick}
      >Bring me another one! 🍻</button
    >
  </div>
  <a href="https://github.com/version0chiro/VS-Meme-Reddit">
    <footer>If you like the project please consider ⭐staring the repo!</footer>
  </a>
</div>

<!-- svelte-ignore missing-declaration -->
<style>
  @font-face {
    font-family: "Gelasio";
    font-style: normal;
    font-weight: 400;
    src: local("Gelasio Regular"), local("Gelasio-Regular"),
      url(https://fonts.gstatic.com/s/gelasio/v1/cIf9MaFfvUQxTTqS9C6hYQ.woff2)
        format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
  }
  .container {
    position: relative;
    height: 100vh;
  }
  footer {
    position: absolute;
    bottom: 0vh;
    padding: var(--input-padding-vertical) var(--input-padding-horizontal);
    text-align: center;
    margin-top: 10px;
    width: 100%;
    border: 3px solid #c15111;
  }
  img {
    border: 1px solid;
    border-color: aquamarine;
    width: 200%;
    max-height: 80vh;
  }
  p {
    margin: 10px;
  }

  h3 {
    font-family: Gelasio;
    margin: 10px;
    text-align: center;
  }
  .button-stack {
    display: flex;
    flex-direction: row;
    justify-content: center;
    position: absolute;
    bottom: 10vh;
    width: 100%;
  }
  .btn {
    flex: 1;
    border: none;
    padding: var(--input-padding-vertical) var(--input-padding-horizontal);
    width: 100%;
    margin: 5px;
    text-align: center;
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
    border-radius: 15px;
    outline: none;
  }

  .btn:hover {
    background-color: orange;
  }
  .btn:focus {
    background-color: rgb(255, 106, 0);
  }
</style>
