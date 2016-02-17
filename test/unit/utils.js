import {parse} from 'babylon';
import generator from 'babel-generator';
import {isSimple} from '../../src/utils';

describe.only('utils', function() {
  'use strict';
  describe('isSimple', function() {
    it('primitive value', function() {
      isSimple(getNode('tmp = null')).should.equal(true);
      isSimple(getNode('tmp = true')).should.equal(true);
      isSimple(getNode('tmp = 123')).should.equal(true);
      isSimple(getNode('tmp = "foo";')).should.equal(true);
      isSimple(getNode("tmp = 'foo'")).should.equal(true);
    });
    it('undefined value', function() {
      isSimple(getNode('tmp = undefined')).should.equal(true);
    });
    it('function value', function() {
      isSimple(getNode('tmp = function() {}')).should.equal(true);
      isSimple(getNode('tmp = a=>123')).should.equal(true);
      isSimple(getNode('tmp = ()=>123')).should.equal(true);
      isSimple(getNode('tmp = ()=>{return 123}')).should.equal(true);
    });
    it('accessor value', function() {
      isSimple(getNode('tmp = qwe.asd')).should.equal(false);
      isSimple(getNode('tmp = qwe[123]')).should.equal(false);
    });
    it('call value', function() {
      isSimple(getNode('tmp = qwe.asd()')).should.equal(false);
      isSimple(getNode('tmp = qwe[123]()')).should.equal(false);
    });
    it('array value', function() {
      isSimple(getNode('tmp = [null, true, undefined, 123, "foo", function() {}]')).should.equal(true);
      isSimple(getNode('tmp = [qwe.asd]')).should.equal(false);
      isSimple(getNode('tmp = [qwe.asd()]')).should.equal(false);
    });
    it('object value', function() {
      // @todo keys - maybe destruction - {['qwe'+asd()]: 'zxc'}
      isSimple(getNode('tmp = {foo:123, "bar":456, \'baz\':789}')).should.equal(false);
      isSimple(getNode('tmp = {["foo"]: "bar"}')).should.equal(false);
    });


    function getNode(code) {
      //console.log(parse(code).program.body[0].expression.right);
      var node = parse(code).program.body[0].expression.right;
      //console.log(generator(node).code);
      return node;
    }
  });
});
