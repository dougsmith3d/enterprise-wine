/*
 * Stripe-style WebGL Gradient Animation
 * Based on https://kevinhufnagl.com/how-to-stripe-website-gradient-effect/
 * Ported to TypeScript for Next.js
 */

function normalizeColor(hexCode: number): number[] {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ];
}

// ─── MiniGl ───────────────────────────────────────────────────────────────────

class MiniGl {
  canvas!: HTMLCanvasElement;
  gl!: WebGLRenderingContext;
  meshes!: MiniGlMesh[];
  commonUniforms!: Record<string, MiniGlUniform>;
  width = 0;
  height = 0;

  Material!: new (
    vertexShaders: string,
    fragments: string,
    uniforms?: Record<string, MiniGlUniform>
  ) => MiniGlMaterial;

  Uniform!: new (e: Record<string, unknown>) => MiniGlUniform;
  PlaneGeometry!: new (
    width?: number,
    height?: number,
    n?: number,
    i?: number,
    orientation?: string
  ) => MiniGlPlaneGeometry;
  Mesh!: new (
    geometry: MiniGlPlaneGeometry,
    material: MiniGlMaterial
  ) => MiniGlMesh;
  Attribute!: new (e: Record<string, unknown>) => MiniGlAttribute;

  constructor(canvas: HTMLCanvasElement, width?: number, height?: number) {
    const _miniGl = this;
    _miniGl.canvas = canvas;
    _miniGl.gl = _miniGl.canvas.getContext("webgl", {
      antialias: true,
    })!;
    _miniGl.meshes = [];

    const context = _miniGl.gl;
    if (width && height) this.setSize(width, height);

    // ── Attribute ─────────────────────────────────────────────────
    _miniGl.Attribute = class {
      type: number;
      normalized: boolean;
      buffer: WebGLBuffer;
      target: number;
      size: number;
      values?: Float32Array | Uint16Array;

      constructor(e: Record<string, unknown>) {
        this.type = context.FLOAT;
        this.normalized = false;
        this.buffer = context.createBuffer()!;
        this.target = (e.target as number) ?? context.ARRAY_BUFFER;
        this.size = (e.size as number) ?? 1;
        Object.assign(this, e);
        this.update();
      }

      update() {
        if (this.values !== undefined) {
          context.bindBuffer(this.target, this.buffer);
          context.bufferData(this.target, this.values, context.STATIC_DRAW);
        }
      }

      attach(name: string, program: WebGLProgram): number {
        const loc = context.getAttribLocation(program, name);
        if (this.target === context.ARRAY_BUFFER) {
          context.enableVertexAttribArray(loc);
          context.vertexAttribPointer(
            loc,
            this.size,
            this.type,
            this.normalized,
            0,
            0
          );
        }
        return loc;
      }

      use(loc: number) {
        context.bindBuffer(this.target, this.buffer);
        if (this.target === context.ARRAY_BUFFER) {
          context.enableVertexAttribArray(loc);
          context.vertexAttribPointer(
            loc,
            this.size,
            this.type,
            this.normalized,
            0,
            0
          );
        }
      }
    } as unknown as new (e: Record<string, unknown>) => MiniGlAttribute;

    // ── Uniform ──────────────────────────────────────────────────
    _miniGl.Uniform = class {
      type: string;
      value: unknown;
      typeFn: string;
      excludeFrom?: string;
      transpose?: boolean;

      constructor(e: Record<string, unknown>) {
        this.type = "float";
        Object.assign(this, e);
        this.typeFn =
          ({
            float: "1f",
            int: "1i",
            vec2: "2fv",
            vec3: "3fv",
            vec4: "4fv",
            mat4: "Matrix4fv",
          } as Record<string, string>)[this.type] || "1f";
      }

      update(location: WebGLUniformLocation) {
        if (this.value !== undefined) {
          const fn = `uniform${this.typeFn}` as keyof WebGLRenderingContext;
          if (this.typeFn.indexOf("Matrix") === 0) {
            (context[fn] as Function)(location, this.transpose ?? false, this.value);
          } else {
            (context[fn] as Function)(location, this.value);
          }
        }
      }

      getDeclaration(name: string, type: string, length?: number): string {
        if (this.excludeFrom === type) return "";

        if (this.type === "array") {
          const arr = this.value as MiniGlUniform[];
          return (
            arr[0].getDeclaration(name, type, arr.length) +
            `\nconst int ${name}_length = ${arr.length};`
          );
        }

        if (this.type === "struct") {
          let nameNoPrefix = name.replace("u_", "");
          nameNoPrefix =
            nameNoPrefix.charAt(0).toUpperCase() + nameNoPrefix.slice(1);
          const entries = Object.entries(
            this.value as Record<string, MiniGlUniform>
          );
          return (
            `uniform struct ${nameNoPrefix}\n{\n` +
            entries
              .map(([n, u]) => u.getDeclaration(n, type).replace(/^uniform/, ""))
              .join("") +
            `\n} ${name}${length && length > 0 ? `[${length}]` : ""};`
          );
        }

        return `uniform ${this.type} ${name}${length && length > 0 ? `[${length}]` : ""};`;
      }
    } as unknown as new (e: Record<string, unknown>) => MiniGlUniform;

    // ── Material ─────────────────────────────────────────────────
    _miniGl.Material = class {
      uniforms!: Record<string, MiniGlUniform>;
      uniformInstances!: { uniform: MiniGlUniform; location: WebGLUniformLocation }[];
      program!: WebGLProgram;

      constructor(
        vertexShaders: string,
        fragments: string,
        uniforms: Record<string, MiniGlUniform> = {}
      ) {
        const material = this;

        function getShaderByType(type: number, source: string): WebGLShader {
          const shader = context.createShader(type)!;
          context.shaderSource(shader, source);
          context.compileShader(shader);
          if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            console.error(context.getShaderInfoLog(shader));
          }
          return shader;
        }

        function getUniformDeclarations(
          u: Record<string, MiniGlUniform>,
          type: string
        ): string {
          return Object.entries(u)
            .map(([name, val]) => val.getDeclaration(name, type))
            .join("\n");
        }

        material.uniforms = uniforms;
        material.uniformInstances = [];

        const prefix = "\n precision highp float;\n ";
        const vertexSource = `\n ${prefix}\n attribute vec4 position;\n attribute vec2 uv;\n attribute vec2 uvNorm;\n ${getUniformDeclarations(_miniGl.commonUniforms, "vertex")}\n ${getUniformDeclarations(uniforms, "vertex")}\n ${vertexShaders}\n `;
        const fragmentSource = `\n ${prefix}\n ${getUniformDeclarations(_miniGl.commonUniforms, "fragment")}\n ${getUniformDeclarations(uniforms, "fragment")}\n ${fragments}\n `;

        const vertexShader = getShaderByType(context.VERTEX_SHADER, vertexSource);
        const fragmentShader = getShaderByType(
          context.FRAGMENT_SHADER,
          fragmentSource
        );
        material.program = context.createProgram()!;

        context.attachShader(material.program, vertexShader);
        context.attachShader(material.program, fragmentShader);
        context.linkProgram(material.program);
        if (
          !context.getProgramParameter(material.program, context.LINK_STATUS)
        ) {
          console.error(context.getProgramInfoLog(material.program));
        }

        context.useProgram(material.program);
        material.attachUniforms(undefined, _miniGl.commonUniforms);
        material.attachUniforms(undefined, material.uniforms);
      }

      attachUniforms(
        name: string | undefined,
        uniforms: MiniGlUniform | Record<string, MiniGlUniform>
      ) {
        const material = this;
        if (name === undefined) {
          Object.entries(uniforms as Record<string, MiniGlUniform>).forEach(
            ([n, u]) => material.attachUniforms(n, u)
          );
        } else {
          const u = uniforms as MiniGlUniform;
          if (u.type === "array") {
            (u.value as MiniGlUniform[]).forEach((item, i) =>
              material.attachUniforms(`${name}[${i}]`, item)
            );
          } else if (u.type === "struct") {
            Object.entries(u.value as Record<string, MiniGlUniform>).forEach(
              ([field, val]) => material.attachUniforms(`${name}.${field}`, val)
            );
          } else {
            material.uniformInstances.push({
              uniform: u,
              location: context.getUniformLocation(material.program, name)!,
            });
          }
        }
      }
    } as unknown as new (
      v: string,
      f: string,
      u?: Record<string, MiniGlUniform>
    ) => MiniGlMaterial;

    // ── PlaneGeometry ────────────────────────────────────────────
    _miniGl.PlaneGeometry = class {
      xSegCount = 0;
      ySegCount = 0;
      vertexCount = 0;
      quadCount = 0;
      width = 0;
      height = 0;
      orientation = "xz";
      attributes: {
        position: MiniGlAttribute;
        uv: MiniGlAttribute;
        uvNorm: MiniGlAttribute;
        index: MiniGlAttribute;
      };

      constructor(
        w?: number,
        h?: number,
        n?: number,
        i?: number,
        orientation?: string
      ) {
        context.createBuffer();
        this.attributes = {
          position: new _miniGl.Attribute({
            target: context.ARRAY_BUFFER,
            size: 3,
          }),
          uv: new _miniGl.Attribute({
            target: context.ARRAY_BUFFER,
            size: 2,
          }),
          uvNorm: new _miniGl.Attribute({
            target: context.ARRAY_BUFFER,
            size: 2,
          }),
          index: new _miniGl.Attribute({
            target: context.ELEMENT_ARRAY_BUFFER,
            size: 3,
            type: context.UNSIGNED_SHORT,
          }),
        };
        this.setTopology(n, i);
        this.setSize(w, h, orientation);
      }

      setTopology(xSeg = 1, ySeg = 1) {
        const geo = this;
        geo.xSegCount = xSeg;
        geo.ySegCount = ySeg;
        geo.vertexCount = (geo.xSegCount + 1) * (geo.ySegCount + 1);
        geo.quadCount = geo.xSegCount * geo.ySegCount * 2;
        geo.attributes.uv.values = new Float32Array(2 * geo.vertexCount);
        geo.attributes.uvNorm.values = new Float32Array(2 * geo.vertexCount);
        geo.attributes.index.values = new Uint16Array(3 * geo.quadCount);

        for (let y = 0; y <= geo.ySegCount; y++) {
          for (let x = 0; x <= geo.xSegCount; x++) {
            const idx = y * (geo.xSegCount + 1) + x;
            geo.attributes.uv.values[2 * idx] = x / geo.xSegCount;
            geo.attributes.uv.values[2 * idx + 1] = 1 - y / geo.ySegCount;
            geo.attributes.uvNorm.values[2 * idx] =
              (x / geo.xSegCount) * 2 - 1;
            geo.attributes.uvNorm.values[2 * idx + 1] =
              1 - (y / geo.ySegCount) * 2;

            if (x < geo.xSegCount && y < geo.ySegCount) {
              const s = y * geo.xSegCount + x;
              geo.attributes.index.values[6 * s] = idx;
              geo.attributes.index.values[6 * s + 1] = idx + 1 + geo.xSegCount;
              geo.attributes.index.values[6 * s + 2] = idx + 1;
              geo.attributes.index.values[6 * s + 3] = idx + 1;
              geo.attributes.index.values[6 * s + 4] = idx + 1 + geo.xSegCount;
              geo.attributes.index.values[6 * s + 5] = idx + 2 + geo.xSegCount;
            }
          }
        }
        geo.attributes.uv.update();
        geo.attributes.uvNorm.update();
        geo.attributes.index.update();
      }

      setSize(w = 1, h = 1, orientation = "xz") {
        const geo = this;
        geo.width = w;
        geo.height = h;
        geo.orientation = orientation;

        if (
          !geo.attributes.position.values ||
          geo.attributes.position.values.length !== 3 * geo.vertexCount
        ) {
          geo.attributes.position.values = new Float32Array(
            3 * geo.vertexCount
          );
        }

        const ox = w / -2;
        const oy = h / -2;
        const sw = w / geo.xSegCount;
        const sh = h / geo.ySegCount;

        for (let y = 0; y <= geo.ySegCount; y++) {
          const ty = oy + y * sh;
          for (let x = 0; x <= geo.xSegCount; x++) {
            const tx = ox + x * sw;
            const l = y * (geo.xSegCount + 1) + x;
            (geo.attributes.position.values as Float32Array)[
              3 * l + "xyz".indexOf(orientation[0])
            ] = tx;
            (geo.attributes.position.values as Float32Array)[
              3 * l + "xyz".indexOf(orientation[1])
            ] = -ty;
          }
        }
        geo.attributes.position.update();
      }
    } as unknown as new (
      w?: number,
      h?: number,
      n?: number,
      i?: number,
      o?: string
    ) => MiniGlPlaneGeometry;

    // ── Mesh ─────────────────────────────────────────────────────
    _miniGl.Mesh = class {
      geometry!: MiniGlPlaneGeometry;
      material!: MiniGlMaterial;
      wireframe = false;
      attributeInstances!: { attribute: MiniGlAttribute; location: number }[];

      constructor(geometry: MiniGlPlaneGeometry, material: MiniGlMaterial) {
        const mesh = this;
        mesh.geometry = geometry;
        mesh.material = material;
        mesh.attributeInstances = [];

        Object.entries(mesh.geometry.attributes).forEach(
          ([name, attribute]) => {
            mesh.attributeInstances.push({
              attribute: attribute as MiniGlAttribute,
              location: (attribute as MiniGlAttribute).attach(
                name,
                mesh.material.program
              ),
            });
          }
        );
        _miniGl.meshes.push(mesh as unknown as MiniGlMesh);
      }

      draw() {
        context.useProgram(this.material.program);
        this.material.uniformInstances.forEach(({ uniform, location }) =>
          uniform.update(location)
        );
        this.attributeInstances.forEach(({ attribute, location }) =>
          attribute.use(location)
        );
        context.drawElements(
          this.wireframe ? context.LINES : context.TRIANGLES,
          this.geometry.attributes.index.values!.length,
          context.UNSIGNED_SHORT,
          0
        );
      }

      remove() {
        _miniGl.meshes = _miniGl.meshes.filter((e) => e !== (this as unknown as MiniGlMesh));
      }
    } as unknown as new (
      g: MiniGlPlaneGeometry,
      m: MiniGlMaterial
    ) => MiniGlMesh;

    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    _miniGl.commonUniforms = {
      projectionMatrix: new _miniGl.Uniform({
        type: "mat4",
        value: identity,
      }),
      modelViewMatrix: new _miniGl.Uniform({ type: "mat4", value: identity }),
      resolution: new _miniGl.Uniform({ type: "vec2", value: [1, 1] }),
      aspectRatio: new _miniGl.Uniform({ type: "float", value: 1 }),
    };
  }

  setSize(w = 640, h = 480) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = w;
    this.height = h;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.gl.viewport(0, 0, w * dpr, h * dpr);
    this.commonUniforms.resolution.value = [w * dpr, h * dpr];
    this.commonUniforms.aspectRatio.value = w / h;
  }

  setOrthographicCamera(
    e = 0,
    t = 0,
    n = 0,
    near = -2000,
    far = 2000
  ) {
    this.commonUniforms.projectionMatrix.value = [
      2 / this.width, 0, 0, 0,
      0, 2 / this.height, 0, 0,
      0, 0, 2 / (near - far), 0,
      e, t, n, 1,
    ];
  }

  render() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.meshes.forEach((m) => m.draw());
  }
}

// ─── Type interfaces ──────────────────────────────────────────────────────────

interface MiniGlUniform {
  type: string;
  value: unknown;
  typeFn: string;
  excludeFrom?: string;
  transpose?: boolean;
  update(location: WebGLUniformLocation): void;
  getDeclaration(name: string, type: string, length?: number): string;
}

interface MiniGlAttribute {
  type: number;
  normalized: boolean;
  buffer: WebGLBuffer;
  target: number;
  size: number;
  values?: Float32Array | Uint16Array;
  update(): void;
  attach(name: string, program: WebGLProgram): number;
  use(loc: number): void;
}

interface MiniGlMaterial {
  uniforms: Record<string, MiniGlUniform>;
  uniformInstances: { uniform: MiniGlUniform; location: WebGLUniformLocation }[];
  program: WebGLProgram;
  attachUniforms(
    name: string | undefined,
    uniforms: MiniGlUniform | Record<string, MiniGlUniform>
  ): void;
}

interface MiniGlPlaneGeometry {
  xSegCount: number;
  ySegCount: number;
  vertexCount: number;
  quadCount: number;
  width: number;
  height: number;
  orientation: string;
  attributes: {
    position: MiniGlAttribute;
    uv: MiniGlAttribute;
    uvNorm: MiniGlAttribute;
    index: MiniGlAttribute;
  };
  setTopology(xSeg?: number, ySeg?: number): void;
  setSize(w?: number, h?: number, orientation?: string): void;
}

interface MiniGlMesh {
  geometry: MiniGlPlaneGeometry;
  material: MiniGlMaterial;
  wireframe: boolean;
  draw(): void;
  remove(): void;
}

// ─── GLSL Shaders ─────────────────────────────────────────────────────────────

const noiseShader = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0,i1.z,i2.z,1.0))
  + i.y + vec4(0.0,i1.y,i2.y,1.0))
  + i.x + vec4(0.0,i1.x,i2.x,1.0));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j  = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x  = x_ * ns.x + ns.yyyy;
  vec4 y  = y_ * ns.x + ns.yyyy;
  vec4 h  = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const blendShader = `
vec3 blendNormal(vec3 base, vec3 blend) { return blend; }
vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
  return blendNormal(base, blend) * opacity + base * (1.0 - opacity);
}
`;

const vertexShader = `
varying vec3 v_color;
void main() {
  float time = u_time * u_global.noiseSpeed;
  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;

  float tilt = resolution.y / 2.0 * uvNorm.y;
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;
  float offset = resolution.x / 2.0 * u_vertDeform.incline *
    mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);

  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
    noiseCoord.y * u_vertDeform.noiseFreq.y,
    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
  )) * u_vertDeform.noiseAmp;
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);
  noise = max(0.0, noise);

  vec3 pos = vec3(position.x, position.y + tilt + incline + noise - offset, position.z);

  if (u_active_colors[0] == 1.) v_color = u_baseColor;
  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.) {
      WaveLayers layer = u_waveLayers[i];
      float layerNoise = smoothstep(
        layer.noiseFloor,
        layer.noiseCeil,
        snoise(vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed
        )) / 2.0 + 0.5
      );
      v_color = blendNormal(v_color, layer.color, pow(layerNoise, 4.));
    }
  }
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
varying vec3 v_color;
void main() {
  vec3 color = v_color;
  if (u_darken_top == 1.0) {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

// ─── Gradient ─────────────────────────────────────────────────────────────────

export class Gradient {
  el: HTMLCanvasElement | null = null;
  cssVarRetries = 0;
  maxCssVarRetries = 200;
  angle = 0;
  isLoadedClass = false;
  isScrolling = false;
  scrollingTimeout: ReturnType<typeof setTimeout> | undefined;
  scrollingRefreshDelay = 200;
  isIntersecting = false;
  sectionColors: number[][] = [];
  computedCanvasStyle: CSSStyleDeclaration | null = null;
  conf = {
    wireframe: false,
    density: [0.06, 0.16] as [number, number],
    zoom: 1,
    rotation: 0,
    playing: true,
  };
  uniforms: Record<string, MiniGlUniform> = {};
  t = 1253106;
  last = 0;
  width = 0;
  minWidth = 1111;
  height = 600;
  xSegCount = 0;
  ySegCount = 0;
  mesh!: MiniGlMesh;
  material!: MiniGlMaterial;
  geometry!: MiniGlPlaneGeometry;
  minigl!: MiniGl;
  scrollObserver: IntersectionObserver | null = null;
  amp = 180;
  seed = 5;
  freqX = 14e-5;
  freqY = 29e-5;
  activeColors = [1, 1, 1, 1];
  animFrame = 0;

  handleScroll = () => {
    clearTimeout(this.scrollingTimeout);
    this.scrollingTimeout = setTimeout(
      this.handleScrollEnd,
      this.scrollingRefreshDelay
    );
    if (this.conf.playing) {
      this.isScrolling = true;
      this.pause();
    }
  };

  handleScrollEnd = () => {
    this.isScrolling = false;
    if (this.isIntersecting) this.play();
  };

  resize = () => {
    const rect = this.el?.parentElement?.getBoundingClientRect();
    this.width = rect?.width ?? window.innerWidth;
    this.height = (rect?.height && rect.height > 10) ? rect.height : 600;
    this.minigl.setSize(this.width, this.height);
    this.minigl.setOrthographicCamera();
    this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
    this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
    this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount);
    this.mesh.geometry.setSize(this.width, this.height);
    this.mesh.material.uniforms.u_shadow_power.value =
      this.width < 600 ? 5 : 6;
  };

  animate = (time: number) => {
    if (!this.shouldSkipFrame(time)) {
      this.t += Math.min(time - this.last, 1000 / 15);
      this.last = time;
      this.mesh.material.uniforms.u_time.value = this.t;
      this.minigl.render();
    }
    if (this.conf.playing) {
      this.animFrame = requestAnimationFrame(this.animate);
    }
  };

  pause = () => {
    this.conf.playing = false;
  };

  play = () => {
    if (!this.conf.playing) {
      this.conf.playing = true;
      requestAnimationFrame(this.animate);
    }
  };

  initGradient(selector: string) {
    this.el = document.querySelector(selector);
    if (!this.el) return this;
    this.connect();
    return this;
  }

  connect() {
    this.minigl = new MiniGl(this.el!, undefined, undefined);

    requestAnimationFrame(() => {
      if (this.el) {
        this.computedCanvasStyle = getComputedStyle(this.el);
        this.waitForCssVars();
      }
    });
  }

  disconnect() {
    this.conf.playing = false;
    cancelAnimationFrame(this.animFrame);
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.resize);
  }

  initMaterial(): MiniGlMaterial {
    this.uniforms = {
      u_time: new this.minigl.Uniform({ value: 0 }),
      u_shadow_power: new this.minigl.Uniform({ value: 5 }),
      u_darken_top: new this.minigl.Uniform({ value: 0 }),
      u_active_colors: new this.minigl.Uniform({
        value: this.activeColors,
        type: "vec4",
      }),
      u_global: new this.minigl.Uniform({
        value: {
          noiseFreq: new this.minigl.Uniform({
            value: [this.freqX, this.freqY],
            type: "vec2",
          }),
          noiseSpeed: new this.minigl.Uniform({ value: 5e-6 }),
        },
        type: "struct",
      }),
      u_vertDeform: new this.minigl.Uniform({
        value: {
          incline: new this.minigl.Uniform({
            value:
              Math.sin(this.angle) /
              Math.cos(this.angle),
          }),
          offsetTop: new this.minigl.Uniform({ value: -0.5 }),
          offsetBottom: new this.minigl.Uniform({ value: -0.5 }),
          noiseFreq: new this.minigl.Uniform({
            value: [3, 4],
            type: "vec2",
          }),
          noiseAmp: new this.minigl.Uniform({ value: this.amp }),
          noiseSpeed: new this.minigl.Uniform({ value: 10 }),
          noiseFlow: new this.minigl.Uniform({ value: 3 }),
          noiseSeed: new this.minigl.Uniform({ value: this.seed }),
        },
        type: "struct",
        excludeFrom: "fragment",
      }),
      u_baseColor: new this.minigl.Uniform({
        value: this.sectionColors[0],
        type: "vec3",
        excludeFrom: "fragment",
      }),
      u_waveLayers: new this.minigl.Uniform({
        value: [] as MiniGlUniform[],
        excludeFrom: "fragment",
        type: "array",
      }),
    };

    for (let i = 1; i < this.sectionColors.length; i++) {
      (this.uniforms.u_waveLayers.value as MiniGlUniform[]).push(
        new this.minigl.Uniform({
          value: {
            color: new this.minigl.Uniform({
              value: this.sectionColors[i],
              type: "vec3",
            }),
            noiseFreq: new this.minigl.Uniform({
              value: [
                2 + i / this.sectionColors.length,
                3 + i / this.sectionColors.length,
              ],
              type: "vec2",
            }),
            noiseSpeed: new this.minigl.Uniform({ value: 11 + 0.3 * i }),
            noiseFlow: new this.minigl.Uniform({ value: 6.5 + 0.3 * i }),
            noiseSeed: new this.minigl.Uniform({ value: this.seed + 10 * i }),
            noiseFloor: new this.minigl.Uniform({ value: 0.1 }),
            noiseCeil: new this.minigl.Uniform({
              value: 0.63 + 0.07 * i,
            }),
          },
          type: "struct",
        })
      );
    }

    const fullVertexShader = [noiseShader, blendShader, vertexShader].join(
      "\n\n"
    );
    return new this.minigl.Material(
      fullVertexShader,
      fragmentShader,
      this.uniforms
    );
  }

  initMesh() {
    this.material = this.initMaterial();
    this.geometry = new this.minigl.PlaneGeometry();
    this.mesh = new this.minigl.Mesh(this.geometry, this.material);
  }

  shouldSkipFrame(time: number): boolean {
    return (
      !!document.hidden ||
      !this.conf.playing ||
      parseInt(String(time), 10) % 2 === 0
    );
  }

  init() {
    this.initGradientColors();
    this.initMesh();
    this.resize();
    requestAnimationFrame(this.animate);
    window.addEventListener("resize", this.resize);

    // Intersection observer — pause when out of view
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isIntersecting = entry.isIntersecting;
          if (entry.isIntersecting) {
            this.play();
          } else {
            this.pause();
          }
        });
      },
      { threshold: 0 }
    );
    if (this.el?.parentElement) {
      this.scrollObserver.observe(this.el.parentElement);
    }
  }

  waitForCssVars() {
    if (
      this.computedCanvasStyle &&
      this.computedCanvasStyle
        .getPropertyValue("--gradient-color-1")
        .indexOf("#") !== -1
    ) {
      this.init();
      this.isLoadedClass = true;
      if (this.el) this.el.classList.add("isLoaded");
    } else {
      this.cssVarRetries++;
      if (this.cssVarRetries > this.maxCssVarRetries) {
        // Fallback colors
        this.sectionColors = [
          normalizeColor(0x0b0f14),
          normalizeColor(0x5eead4),
          normalizeColor(0x2dd4bf),
          normalizeColor(0x111827),
        ];
        return this.init();
      }
      requestAnimationFrame(() => this.waitForCssVars());
    }
  }

  initGradientColors() {
    this.sectionColors = [
      "--gradient-color-1",
      "--gradient-color-2",
      "--gradient-color-3",
      "--gradient-color-4",
    ]
      .map((prop) => {
        let hex = this.computedCanvasStyle!.getPropertyValue(prop).trim();
        if (hex.length === 4) {
          const expanded = hex
            .substring(1)
            .split("")
            .map((c) => c + c)
            .join("");
          hex = `#${expanded}`;
        }
        return hex ? `0x${hex.substring(1)}` : null;
      })
      .filter(Boolean)
      .map((h) => normalizeColor(Number(h)));
  }
}
