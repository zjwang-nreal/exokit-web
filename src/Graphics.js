import GlobalContext from './GlobalContext.js';

/* const {OffscreenCanvasRenderingContext2D, WebGLRenderingContext: OffscreenWebGLRenderingContext, WebGL2RenderingContext: OffscreenWebGL2RenderingContext} = self;
self.OffscreenCanvasRenderingContext2D = undefined;
self.WebGLRenderingContext = undefined;
self.WebGL2RenderingContext = undefined; */

const {WebGLRenderingContext, WebGL2RenderingContext, CanvasRenderingContext2D} = self;

/* const _inherit = (a, b) => {
  for (const k in b) {
    if (!(k in a)) {
      a[k] = b[k];
    }
  }
  for (const k in b.prototype) {
    if (!(k in a.prototype)) {
      const o = Object.getOwnPropertyDescriptor(b.prototype, k);
      if (o.get) {
        o.get = (get => function() {
          return get.apply(this.backingContext, arguments);
        })(o.get);
        o.set = (set => function() {
          return set.apply(this.backingContext, arguments);
        })(o.set);
        Object.defineProperty(a.prototype, k, o);
      } else {
        const {value} = o;
        a.prototype[k] = typeof value === 'function' ? function() {
          return value.apply(this.backingContext, arguments);
        } : value;
      }
    }
  }
}; */

const _makeState = gl => ({
  vao: null,

  arrayBuffer: null,
  renderbuffer: {},
  framebuffer: {},

  blend: false,
  cullFace: false,
  depthTest: false,
  dither: false,
  polygonOffsetFill: false,
  sampleAlphaToCoverage: false,
  sampleCoverage: false,
  scissorTest: false,
  stencilTest: false,

  activeTexture: gl.TEXTURE0,

  packAlignment: 4,
  unpackAlignment: 4,
  unpackColorspaceConversion: gl.BROWSER_DEFAULT_WEBGL,
  unpackFlipY: 0,
  unpackPremultiplyAlpha: 0,

  currentProgram: null,
  viewport: [0, 0, gl.canvas.width, gl.canvas.height],
  scissor: [0, 0, 0, 0],
  blendSrcRgb: gl.ONE,
  blendDstRgb: gl.ZERO,
  blendSrcAlpha: gl.ONE,
  blendDstAlpha: gl.ZERO,
  blendEquationRgb: gl.FUNC_ADD,
  blendEquationAlpha: gl.FUNC_ADD,
  blendColor: [0, 0, 0, 0],
  colorClearValue: [0, 0, 0, 0],
  colorMask: [true, true, true, true],
  cullFaceMode: gl.BACK,
  depthClearValue: 1,
  depthFunc: gl.LESS,
  depthRange: [0, 1],
  depthMask: true,
  frontFace: gl.CCW,
  generateMipmapHint: gl.DONT_CARE,
  lineWidth: 1,
  polygonOffsetFactor: 0,
  polygonOffsetUnits: 0,
  sampleCoverageValue: 1,
  sampleCoverageUnits: false,
  stencilBackFail: gl.KEEP,
  stencilBackFunc: gl.ALWAYS,
  stencilBackPassDepthFail: gl.KEEP,
  stencilBackPassDepthPass: gl.KEEP,
  stencilBackRef: 0,
  stencilBackValueMask: 0xFFFFFFFF,
  stencilBackWriteMask: 0xFFFFFFFF,
  stencilClearValue: 0,
  stencilFail: gl.KEEP,
  stencilFunc: gl.ALWAYS,
  stencilPassDepthFail: gl.KEEP,
  stencilPassDpethPass: gl.KEEP,
  stencilRef: 0,
  stencilValueMask: 0xFFFFFFFF,
  stencilWriteMask: 0xFFFFFFFF,

  textureUnits: (() => {
    const numTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    const result = Array(numTextureUnits);
    for (let i = 0; i < numTextureUnits; i++) {
      result[i] = {
        texture2D: null,
        textureCubemap: null,
      };
    }
    return result;
  })(),
});
HTMLCanvasElement.prototype.getContext = (oldGetContext => function getContext(type, init) {
  if (/^(?:experimental-)?webgl2?$/.test(type)) {
    const canvas = this;
    const gl = oldGetContext.call(canvas, type, init);
    gl.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    gl._proxyContext = null;
    Object.defineProperty(gl, 'canvas', {
      get() {
        return canvas;
      },
    });
    /* canvas.getContext = function getContext() {
      return gl;
    }; */

    GlobalContext.contexts.push(gl);

    gl.state = null;
    const enabled = {
      clear: true,
    };
    gl._enabled = enabled;
    const extensions = {
      WEBGL_lose_context: gl._exokitGetExtension('WEBGL_lose_context'),
      OES_vertex_array_object: gl.getExtension('OES_vertex_array_object'),
    };
    gl._extensions = extensions;

    /* new MutationObserver(() => {
      if (this._proxyContext) {
        this._proxyContext.canvas.width = canvas.width;
        this._proxyContext.canvas.height = canvas.height;
      }
    }).observe(this, {
      attributes: true,
      attributeFilter: ['width', 'height'],
    }); */

    const vao = extensions.OES_vertex_array_object.createVertexArrayOES();
    extensions.OES_vertex_array_object.bindVertexArrayOES(vao);

    return gl;
  } else {
    return oldGetContext.call(this, type, init);
  }
})(HTMLCanvasElement.prototype.getContext);
Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
  get() {
    return this.width;
  },
});
Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
  get() {
    return this.height;
  },
});

WebGLRenderingContext.prototype._exokitGetExtension = (oldGetExtension => function _exokitGetExtension() {
  return oldGetExtension.apply(this, arguments);
})(WebGLRenderingContext.prototype.getExtension);
for (const k in WebGLRenderingContext.prototype) {
  const o = Object.getOwnPropertyDescriptor(WebGLRenderingContext.prototype, k);
  if (o.get) {
    o.get = (get => function() {
      return get.apply(this._proxyContext || this, arguments);
    })(o.get);
    o.set = (set => function() {
      return set.apply(this._proxyContext || this, arguments);
    })(o.set);
    Object.defineProperty(WebGLRenderingContext.prototype, k, o);
  } else {
    const {value} = o;
    if (typeof value === 'function') {
      const {getError} = WebGLRenderingContext.prototype;
      WebGLRenderingContext.prototype[k] = function() {
        const result = value.apply(this._proxyContext || this, arguments);
        /* const error = getError.call(this);
        if (error) {
          Error.stackTraceLimit = 300;
          console.log('fn', error, !!this._proxyContext, this.lol, k, Array.from(arguments), new Error().stack);
        } */
        return result;
      };
    }
  }
}
WebGLRenderingContext.prototype._exokitClear = (oldClear => function _exokitClear() {
  oldClear.call(this, this.COLOR_BUFFER_BIT|this.DEPTH_BUFFER_BIT|this.STENCIL_BUFFER_BIT);
})(WebGLRenderingContext.prototype.clear);
WebGLRenderingContext.prototype._exokitClearEnabled = function _exokitClearEnabled(enabled) {
  this._enabled.clear = enabled;
};
WebGLRenderingContext.prototype.setProxyContext = function setProxyContext(proxyContext) {
  const ctx = this;
  const {canvas} = ctx;
  this._proxyContext = proxyContext;

  const _resize = () => {
    proxyContext.canvas.width = canvas.width;
    proxyContext.canvas.height = canvas.height;
  };
  new MutationObserver(_resize).observe(canvas, {
    attributes: true,
    attributeFilter: ['width', 'height'],
  });

  /* canvas.addEventListener('webglcontextrestored', e => {
    console.log('re-init 1');
    const ks = ctx.getSupportedExtensions();
    for (let i = 0; i < ks.length; i++) {
      ctx.getExtension(ks[i]);
    }
    console.log('re-init 2');
  }); */
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    setTimeout(() => {
      // console.log('load 1');
      this.state = _makeState(this);
      this._extensions.WEBGL_lose_context.restoreContext();
      // this._proxyContext = proxyContext;
      // console.log('load 2');
    });
  }, {once: true});
  this._extensions.WEBGL_lose_context.loseContext();
};
WebGLRenderingContext.prototype.clear = (oldClear => function clear() {
  if (this._enabled.clear) {
    oldClear.apply(this, arguments);
  }
})(WebGLRenderingContext.prototype.clear);
function enableDisable(gl, feature, enable) {
  if (enable) {
    gl.enable(feature);
  } else {
    gl.disable(feature);
  }
}
WebGLRenderingContext.prototype.setProxyState = function setProxyState() {
  const {_proxyContext: gl, state} = this;

  if (state) {
    gl.getExtension('OES_vertex_array_object').bindVertexArrayOES(state.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, state.arrayBuffer);
    for (const k in state.renderbuffer) {
      gl.bindRenderbuffer(k, state.renderbuffer[k]);
    }
    for (const k in state.framebuffer) {
      gl.bindFramebuffer(k, state.framebuffer[k]);
    }

    enableDisable(gl, gl.BLEND, state.blend);
    enableDisable(gl, gl.CULL_FACE, state.cullFace);
    enableDisable(gl, gl.DEPTH_TEST, state.depthTest);
    enableDisable(gl, gl.DITHER, state.dither);
    enableDisable(gl, gl.POLYGON_OFFSET_FILL, state.polygonOffsetFill);
    enableDisable(gl, gl.SAMPLE_ALPHA_TO_COVERAGE, state.sampleAlphaToCoverage);
    enableDisable(gl, gl.SAMPLE_COVERAGE, state.sampleCoverage);
    enableDisable(gl, gl.SCISSOR_TEST, state.scissorTest);
    enableDisable(gl, gl.STENCIL_TEST, state.stencilTest);

    gl.pixelStorei(gl.PACK_ALIGNMENT, state.packAlignment);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, state.unpackAlignment);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, state.unpackColorspaceConversion);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, state.unpackFlipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, state.unpackPremultiplyAlpha);

    gl.useProgram(state.currentProgram);

    gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
    gl.scissor(state.scissor[0], state.scissor[1], state.scissor[2], state.scissor[3]);
    gl.blendFuncSeparate(state.blendSrcRgb, state.blendDstRgb, state.blendSrcAlpha, state.blendDstAlpha);
    gl.blendEquationSeparate(state.blendEquationRgb, state.blendEquationAlpha);
    gl.blendColor(state.blendColor[0], state.blendColor[1], state.blendColor[2], state.blendColor[3]);
    gl.clearColor(state.colorClearValue[0], state.colorClearValue[1], state.colorClearValue[2], state.colorClearValue[3]);
    gl.colorMask(state.colorMask[0], state.colorMask[1], state.colorMask[2], state.colorMask[3]);
    gl.cullFace(state.cullFaceMode);
    gl.clearDepth(state.depthClearValue);
    gl.depthFunc(state.depthFunc);
    gl.depthRange(state.depthRange[0], state.depthRange[1], state.depthRange[2], state.depthRange[3]);
    gl.depthMask(state.depthMask);
    gl.frontFace(state.frontFace);
    gl.hint(gl.GENERATE_MIPMAP_HINT, state.generateMipmapHint);
    gl.lineWidth(state.lineWidth);
    gl.polygonOffset(state.polygonOffsetFactor, state.polygonOffsetUnits);
    gl.sampleCoverage(state.sampleCoverageValue, state.sampleCoverageUnits);
    gl.stencilFuncSeparate(gl.BACK, state.stencilBackFunc, state.stencilBackRef, state.stencilBackValueMask);
    gl.stencilFuncSeparate(gl.FRONT, state.stencilFunc, state.stencilRef, state.stencilValueMask);
    gl.stencilOpSeparate(gl.BACK, state.stencilBackFail, state.stencilBackPassDepthFail, state.stencilBackPassDepthPass);
    gl.stencilOpSeparate(gl.FRONT, state.stencilFail, state.stencilPassDepthFail, state.stencilPassDepthPass);
    gl.stencilMaskSeparate(gl.BACK, state.stencilBackWriteMask);
    gl.stencilMaskSeparate(gl.FRONT, state.stencilWriteMask);
    gl.clearStencil(state.stencilClearValue);

    for (let i = 0; i < state.textureUnits.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, state.textureUnits[i].texture2D);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, state.textureUnits[i].textureCubemap);
    }
    gl.activeTexture(state.activeTexture);
  }
};
WebGLRenderingContext.prototype.destroy = function destroy() {
  GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
};

// state memoization

WebGLRenderingContext.prototype.getExtension = (_getExtension => function getExtension(name) {
  const gl = this;
  const extension = _getExtension.apply(this, arguments);
  if (this.state && name === 'OES_vertex_array_object') {
    extension.bindVertexArrayOES = (_bindVertexArrayOES => function bindVertexArrayOES(vao) {
      gl.state.vao = vao;
      return _bindVertexArrayOES.apply(this, arguments);
    })(extension.bindVertexArrayOES);
  }
  return extension;
})(WebGLRenderingContext.prototype.getExtension);
WebGLRenderingContext.prototype.bindBuffer = (_bindBuffer => function bindBuffer(target, b) {
  if (this.state && target === this.ARRAY_BUFFER) {
    this.state.arrayBuffer = b;
  }
  return _bindBuffer.apply(this, arguments);
})(WebGLRenderingContext.prototype.bindBuffer);
WebGLRenderingContext.prototype.bindRenderbuffer = (_bindRenderbuffer => function bindRenderbuffer(target, rbo) {
  if (this.state) {
    this.state.renderbuffer[target] = rbo;
  }
  return _bindRenderbuffer.apply(this, arguments);
})(WebGLRenderingContext.prototype.bindRenderbuffer);
WebGLRenderingContext.prototype.bindFramebuffer = (_bindFramebuffer => function bindFramebuffer(target, fbo) {
  if (this.state) {
    this.state.framebuffer[target] = fbo;
  }
  return _bindFramebuffer.apply(this, arguments);
})(WebGLRenderingContext.prototype.bindFramebuffer);
const targetStateKeys = {
  [WebGLRenderingContext.BLEND]: 'blend',
  [WebGLRenderingContext.CULL_FACE]: 'cullFace',
  [WebGLRenderingContext.DEPTH_TEST]: 'depthTest',
  [WebGLRenderingContext.DITHER]: 'dither',
  [WebGLRenderingContext.POLYGON_OFFSET_FILL]: 'polygonOffsetFill',
  [WebGLRenderingContext.SAMPLE_ALPHA_TO_COVERAGE]: 'sampleAlphaToCoverage',
  [WebGLRenderingContext.SAMPLE_COVERAGE]: 'sampleCoverage',
  [WebGLRenderingContext.SCISSOR_TEST]: 'scissorTest',
  [WebGLRenderingContext.STENCIL_TEST]: 'stencilTest',
  [WebGLRenderingContext.PACK_ALIGNMENT]: 'packAlignment',
  [WebGLRenderingContext.UNPACK_ALIGNMENT]: 'unpackAlignment',
  [WebGLRenderingContext.UNPACK_COLORSPACE_CONVERSION_WEBGL]: 'unpackColorspaceConversion',
  [WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL]: 'unpackFlipY',
  [WebGLRenderingContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: 'unpackPremultiplyAlpha',
  [WebGLRenderingContext.GENERATE_MIPMAP_HINT]: 'generateMipmapHint',
};
WebGLRenderingContext.prototype.enable = (_enable => function enable(target) {
  if (this.state) {
    const stateKey = targetStateKeys[target];
    if (stateKey !== undefined) {
      this.state[stateKey] = true;
    }
  }
  return _enable.apply(this, arguments);
})(WebGLRenderingContext.prototype.enable);
WebGLRenderingContext.prototype.disable = (_disable => function disable(target) {
  if (this.state) {
    const stateKey = targetStateKeys[target];
    if (stateKey !== undefined) {
      this.state[stateKey] = false;
    }
  }
  return _disable.apply(this, arguments);
})(WebGLRenderingContext.prototype.disable);
WebGLRenderingContext.prototype.activeTexture = (_activeTexture => function activeTexture(slot) {
  if (this.state) {
    this.state.activeTexture = slot;
  }
  return _activeTexture.apply(this, arguments);
})(WebGLRenderingContext.prototype.activeTexture);
WebGLRenderingContext.prototype.pixelStorei = (_pixelStorei => function pixelStorei(name, value) {
  if (this.state) {
    const stateKey = targetStateKeys[name];
    if (stateKey !== undefined) {
      this.state[stateKey] = value;
    }
  }
  return _pixelStorei.apply(this, arguments);
})(WebGLRenderingContext.prototype.pixelStorei);
WebGLRenderingContext.prototype.useProgram = (_useProgram => function useProgram(program) {
  if (this.state) {
    this.state.currentProgram = program;
  }
  return _useProgram.apply(this, arguments);
})(WebGLRenderingContext.prototype.useProgram);
WebGLRenderingContext.prototype.viewport = (_viewport => function viewport(x, y, w, h) {
  if (this.state) {
    this.state.viewport[0] = x;
    this.state.viewport[1] = y;
    this.state.viewport[2] = w;
    this.state.viewport[3] = h;
  }
  return _viewport.apply(this, arguments);
})(WebGLRenderingContext.prototype.viewport);
WebGLRenderingContext.prototype.scissor = (_scissor => function scissor(x, y, w, h) {
  if (this.state) {
    this.state.scissor[0] = x;
    this.state.scissor[1] = y;
    this.state.scissor[2] = w;
    this.state.scissor[3] = h;
  }
  return _scissor.apply(this, arguments);
})(WebGLRenderingContext.prototype.scissor);
WebGLRenderingContext.prototype.blendFuncSeparate = (_blendFuncSeparate => function blendFuncSeparate(blendSrcRgb, blendDstRgb, blendSrcAlpha, blendDstAlpha) {
  if (this.state) {
    this.state.blendSrcRgb = blendSrcRgb;
    this.state.blendDstRgb = blendDstRgb;
    this.state.blendSrcAlpha = blendSrcAlpha;
    this.state.blendDstAlpha = blendDstAlpha;
  }
  return _blendFuncSeparate.apply(this, arguments);
})(WebGLRenderingContext.prototype.blendFuncSeparate);
WebGLRenderingContext.prototype.blendEquationSeparate = (_blendEquationSeparate => function blendEquationSeparate(blendEquationRgb, blendEquationAlpha) {
  if (this.state) {
    this.state.blendEquationRgb = blendEquationRgb;
    this.state.blendEquationAlpha = blendEquationAlpha;
  }
  return _blendEquationSeparate.apply(this, arguments);
})(WebGLRenderingContext.prototype.blendEquationSeparate);
WebGLRenderingContext.prototype.blendColor = (_blendColor => function blendColor(r, g, b, a) {
  if (this.state) {
    this.state.blendColor[0] = r;
    this.state.blendColor[1] = g;
    this.state.blendColor[2] = b;
    this.state.blendColor[3] = a;
  }
  return _blendColor.apply(this, arguments);
})(WebGLRenderingContext.prototype.blendColor);
WebGLRenderingContext.prototype.clearColor = (_clearColor => function clearColor(r, g, b, a) {
  if (this.state) {
    this.state.colorClearValue[0] = r;
    this.state.colorClearValue[1] = g;
    this.state.colorClearValue[2] = b;
    this.state.colorClearValue[3] = a;
  }
  return _clearColor.apply(this, arguments);
})(WebGLRenderingContext.prototype.clearColor);
WebGLRenderingContext.prototype.colorMask = (_colorMask => function colorMask(r, g, b, a) {
  if (this.state) {
    this.state.colorMask[0] = r;
    this.state.colorMask[1] = g;
    this.state.colorMask[2] = b;
    this.state.colorMask[3] = a;
  }
  return _colorMask.apply(this, arguments);
})(WebGLRenderingContext.prototype.colorMask);
WebGLRenderingContext.prototype.cullFace = (_cullFace => function cullFace(cullFaceMode) {
  if (this.state) {
    this.state.cullFaceMode = cullFaceMode;
  }
  return _cullFace.apply(this, arguments);
})(WebGLRenderingContext.prototype.cullFace);
WebGLRenderingContext.prototype.clearDepth = (_clearDepth => function clearDepth(depthClearValue) {
  if (this.state) {
    this.state.depthClearValue = depthClearValue;
  }
  return _clearDepth.apply(this, arguments);
})(WebGLRenderingContext.prototype.clearDepth);
WebGLRenderingContext.prototype.depthFunc = (_depthFunc => function depthFunc(df) {
  if (this.state) {
    this.state.depthFunc = df;
  }
  return _depthFunc.apply(this, arguments);
})(WebGLRenderingContext.prototype.depthFunc);
WebGLRenderingContext.prototype.depthRange = (_depthRange => function depthRange(near, far) {
  if (this.state) {
    this.state.depthRange[0] = near;
    this.state.depthRange[1] = far;
  }
  return _depthRange.apply(this, arguments);
})(WebGLRenderingContext.prototype.depthRange);
WebGLRenderingContext.prototype.depthMask = (_depthMask => function depthMask(dm) {
  if (this.state) {
    this.state.depthMask = dm;
  }
  return _depthMask.apply(this, arguments);
})(WebGLRenderingContext.prototype.depthMask);
WebGLRenderingContext.prototype.frontFace = (_frontFace => function frontFace(ff) {
  if (this.state) {
    this.state.frontFace = ff;
  }
  return _frontFace.apply(this, arguments);
})(WebGLRenderingContext.prototype.frontFace);
WebGLRenderingContext.prototype.hint = (_hint => function hint(target, value) {
  if (this.state) {
    const stateKey = targetStateKeys[target];
    if (stateKey !== undefined) {
      this.state[stateKey] = value;
    }
  }
  return _hint.apply(this, arguments);
})(WebGLRenderingContext.prototype.hint);
WebGLRenderingContext.prototype.lineWidth = (_lineWidth => function lineWidth(lw) {
  if (this.state) {
    this.state.lineWidth = lw;
  }
  return _lineWidth.apply(this, arguments);
})(WebGLRenderingContext.prototype.lineWidth);
WebGLRenderingContext.prototype.polygonOffset = (_polygonOffset => function polygonOffset(polygonOffsetFactor, polygonOffsetUnits) {
  if (this.state) {
    this.state.polygonOffsetFactor = polygonOffsetFactor;
    this.state.polygonOffsetUnits = polygonOffsetUnits;
  }
  return _polygonOffset.apply(this, arguments);
})(WebGLRenderingContext.prototype.polygonOffset);
WebGLRenderingContext.prototype.sampleCoverage = (_sampleCoverage => function sampleCoverage(sampleCoverageValue, sampleCoverageUnits) {
  if (this.state) {
    this.state.sampleCoverageValue = sampleCoverageValue;
    this.state.sampleCoverageUnits = sampleCoverageUnits;
  }
  return _sampleCoverage.apply(this, arguments);
})(WebGLRenderingContext.prototype.sampleCoverage);
WebGLRenderingContext.prototype.stencilFuncSeparate = (_stencilFuncSeparate => function stencilFuncSeparate(face, func, ref, mask) {
  if (this.state) {
    if (face === this.BACK) {
      this.state.stencilBackFunc = func;
      this.state.stencilBackRef = ref;
      this.state.stencilBackValueMask = mask;
    } else if (face === this.FRONT) {
      this.state.stencilFunc = func;
      this.state.stencilRef = ref;
      this.state.stencilValueMask = mask;
    }
  }
  return _stencilFuncSeparate.apply(this, arguments);
})(WebGLRenderingContext.prototype.stencilFuncSeparate);
WebGLRenderingContext.prototype.stencilOpSeparate = (_stencilOpSeparate => function stencilOpSeparate(face, fail, zfail, zpass) {
  if (this.state) {
    if (face === this.BACK) {
      this.state.stencilBackFail = fail;
      this.state.stencilBackPassDepthFail = zfail;
      this.state.stencilBackPassDepthPass = zpass;
    } else if (face === this.FRONT) {
      this.state.stencilFail = fail;
      this.state.stencilPassDepthFail = zfail;
      this.state.stencilPassDepthPass = zpass;
    }
  }
  return _stencilOpSeparate.apply(this, arguments);
})(WebGLRenderingContext.prototype.stencilOpSeparate);
WebGLRenderingContext.prototype.stencilMaskSeparate = (_stencilMaskSeparate => function stencilMaskSeparate(face, mask) {
  if (this.state) {
    if (face === this.BACK) {
      this.state.stencilBackWriteMask = mask;
    } else if (face === this.FRONT) {
      this.state.stencilWriteMask = mask;
    }
  }
  return _stencilMaskSeparate.apply(this, arguments);
})(WebGLRenderingContext.prototype.stencilMaskSeparate);
WebGLRenderingContext.prototype.clearStencil = (_clearStencil => function stencilClearValue(stencilClearValue) {
  if (this.state) {
    this.state.stencilClearValue = stencilClearValue;
  }
  return _clearStencil.apply(this, arguments);
})(WebGLRenderingContext.prototype.clearStencil);
WebGLRenderingContext.prototype.bindTexture = (_bindTexture => function bindTexture(target, texture) {
  if (this.state) {
    if (target === this.TEXTURE_2D) {
      this.state.textureUnits[this.state.activeTexture - this.TEXTURE0].texture2D = texture;
    } else if (target === this.TEXTURE_CUBE_MAP) {
      this.state.textureUnits[this.state.activeTexture - this.TEXTURE0].textureCubemap = texture;
    }
  }
  return _bindTexture.apply(this, arguments);
})(WebGLRenderingContext.prototype.bindTexture);

export {
  WebGLRenderingContext,
  WebGL2RenderingContext,
  CanvasRenderingContext2D,
};
