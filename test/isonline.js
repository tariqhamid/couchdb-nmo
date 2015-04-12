import assert from 'assert';
import Lab from 'lab';

import isonline from '../src/isonline.js';
import * as common from './common.js';
import log from 'npmlog';


export let lab = Lab.script();

lab.experiment('isonline', () => {

  let servers;

  lab.beforeEach((done) => {
    common.createTestServers().done((s) => {
      servers = s;
      done();
    });
  });

  lab.afterEach((done) => {
    common.stopTestServers(servers).then((res) => {
      done();
    });
  });


  lab.test('rejects the promise for connection errors', (done) => {
    isonline(common.NODE + '/socketclose')
      .catch((err) => {
        assert.ok(err instanceof Error);
        done();
      });
  });

  lab.test('returns error on no value provided', (done) => {
    isonline()
      .catch((err) => {
        assert.ok(err instanceof Error);
        done();
      });
  });

  lab.test('returns error for all other errors', (done) => {
    isonline({})
      .catch((err) => {
        assert.ok(err instanceof Error);
        done();
      });
  });

  lab.test('returns false for down site', (done) => {
    isonline('http://127.0.0.1:65516')
      .then((res) => {
        assert.deepEqual(res, {'http://127.0.0.1:65516': false});
        done();
      });
  });

  lab.test('returns false for down site with bad DNS', (done) => {
    isonline('http://exampleneverexists')
      .then((res) => {
        assert.deepEqual(res, {'http://exampleneverexists': false});
        done();
      });
  });

  lab.test('returns true for online site', (done) => {
    isonline(common.NODE)
      .then((res) => {
        assert.deepEqual(res, {[common.NODE]: true});
        done();
      });
  });

  lab.test('accepts multiple sites', (done) => {
    isonline([common.NODE, common.NODE_TWO])
      .then((res) => {
        assert.deepEqual(res, {[common.NODE]: true, [common.NODE_TWO]: true});
        done();
      });
  });

  lab.test('it logs per default', (done) => {
    let msgs = '';
    log.once('log', ({message: message}) => {
      msgs += message;
    });
    isonline(common.NODE)
      .then((res) => {
        assert.ok(msgs);
        done();
      });
  });

  lab.test('silent does not output', (done) => {

    const oldConsole = console.log;
    console.log = (...args) => {
      throw new Error('not silent');
    };

    isonline(common.NODE, {silent: true, json: false})
      .then((res) => {
        console.log = oldConsole;
        done();
      });
  });

  lab.test('can output json', (done) => {

    const oldConsole = console.log;
    console.log = (...args) => {
      assert.deepEqual({ 'http://127.0.0.1:1337': true }, args[0]);
      return oldConsole.apply(oldConsole, args);
    };

    isonline(common.NODE, {silent: false, json: true})
      .then((res) => {
        console.log = oldConsole;
        done();
      });
  });

  lab.test('if json output is selected, colored output is not provided', (done) => {

    let msgs = '';
    log.once('log', ({message: message}) => {
      msgs += message;
    });

    isonline(common.NODE, {silent: false, json: true})
      .then((res) => {
        assert.ok(!(/seems to be/).test(msgs));
        done();
      });
  });

  lab.test('if silent output is selected, colored output is not provided', (done) => {

    const oldConsole = console.log;
    console.log = (...args) => {
      throw new Error('fail');
      return oldConsole.apply(oldConsole, args);
    };

    let msgs = '';
    log.once('log', ({message: message}) => {
      msgs += message;
    });

    isonline(common.NODE, {silent: true, json: false})
      .then((res) => {
        assert.ok(!(/seems to be/).test(msgs));
        assert.deepEqual(res, {[common.NODE]: true});
        done();
      });
  });

  lab.test('silent & json are not compatible', (done) => {

    isonline(common.NODE, {silent: true, json: true})
      .catch((err) => {
        assert.ok(err instanceof Error);
        done();
      });
  });

});
