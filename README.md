### Minecraft in the browser with `three.js`

This is a small weekend project I put together because I wanted to learn `three.js`. The terrain is procedurally generated using [Perlin Noise](https://en.wikipedia.org/wiki/Perlin_noise#:~:text=Perlin%20noise%20is%20a%20procedural,details%20are%20the%20same%20size.). 

View the project live [minecraft.athk.dev](https://minecraft.athk.dev/)




https://github.com/user-attachments/assets/4b5df915-d2a7-4fe1-b748-a39a14f77ba7




#### Optimization
Currently the grid is $300 * 300 * 10$ (length, width, height). The height is calculated using the function `perlin2(x, y)` where `(x, y)` is the row and column at that point.

That's a LOT of blocks (a max of $9 * 10^5$ blocks) - which gets pretty compute heavy to render. To tackle that there are some techniques available like [frustum culling](https://learnopengl.com/Guest-Articles/2021/Scene/Frustum-Culling), [occlusion culling](https://docs.godotengine.org/en/stable/tutorials/3d/occlusion_culling.html), and [geometric merging](https://medium.com/acrossthegalaxy/unity-tip-combine-meshes-for-performance-and-organization-c3515c844fdb).

- Frustum culling: it's the process of not rendering meshes/objects which are outside of the camera frustum. This is already done by `three.js` so you don't have to manually implement it.

- Occlusion culling: it's the process of not rendering meshes/objects which are hidden to the camera by *other objects*. This is *not* implemented by `three.js`, so you have to implement it manually. NOTE: we haven't done this yet - so there's room for improvement.

- Geometric merging: it's the process of merging multiple similar meshes/objects that share a similar geometry and materials, into a single large mesh. This helps increase performance because the number of vertices to process declines significantly. In our scenario, there are at a maximum of $3 * 10^5$ blocks which share the same geometry and materials, so we merge all of them to get one large mesh (our chunk). This is also not done by `three.js`, we have to manually implement merging.



#### Future ideas

Since we have a basic procedural chunk renderer with textures setup, it would be fun to move toward applying [three.js shaders](https://threejs.org/docs/#api/en/materials/ShaderMaterial) to the render. If you have any suggestions or contributions, feel free to open an issue or a PR - I would be more than happy to go over them.



#### Acknowledgements

The textures are [Vanilla PBR](https://www.curseforge.com/minecraft/texture-packs/vanilla-pbr) minecraft textures from [curseforge.com](https://curseforge.com/).



